/*
Yarn Spinner is licensed to you under the terms found in the file LICENSE.md.
*/
#nullable disable
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using Godot;
using Google.Protobuf.WellKnownTypes;
using Yarn;

namespace YarnSpinnerGodot;

/// <summary>
/// A simple implementation of VariableStorageBehaviour.
/// </summary>
/// <remarks>
/// <para>This class stores variables in memory, and is erased when the game
/// exits.</para>
///
/// <para>This class also has basic serialization and save/load example functions.</para>
///
/// <para>You can also enumerate over the variables by using a <c>foreach</c>
/// loop:</para>
///
/// <code lang="csharp">
/// // 'storage' is an InMemoryVariableStorage
/// foreach (var variable in storage) {
///     string name = variable.Key;
///     System.Object value = variable.Value;
/// }
/// </code>
/// </remarks>
[GlobalClass]
public partial class InMemoryVariableStorage : VariableStorageBehaviour, IEnumerable<KeyValuePair<string, object>>
{
    /// <summary>
    /// Where we're actually keeping our variables
    /// </summary>
    private Dictionary<string, object> variables = new Dictionary<string, object>();

    private Dictionary<string, System.Type>
        variableTypes = new Dictionary<string, System.Type>(); // needed for serialization

    [Export] public bool showDebug;

    /// <summary>
    /// A <see cref="RichTextLabel"/> that can show the current list
    /// of all variables in-game. Optional.
    /// </summary>
    [Export] private RichTextLabel debugTextView;

    public override void _Process(double delta)
    {
        // If we have a debug view, show the list of all variables in it
        if (IsInstanceValid(debugTextView))
        {
            debugTextView.Text = GetDebugList();
        }
    }

    public string GetDebugList()
    {
        var stringBuilder = new System.Text.StringBuilder();
        foreach (KeyValuePair<string, object> item in variables)
        {
            stringBuilder.AppendLine(string.Format("{0} = {1} ({2})",
                item.Key,
                item.Value.ToString(),
                variableTypes[item.Key].ToString().Substring("System.".Length)));
        }

        return stringBuilder.ToString();
    }


    #region Setters

    /// <summary>
    /// Used internally by serialization functions to wrap around the
    /// SetValue() methods.
    /// </summary>
    void SetVariable(string name, Yarn.IType type, string value)
    {
        if (type == Yarn.Types.Boolean)
        {
            bool newBool;
            if (bool.TryParse(value, out newBool))
            {
                SetValue(name, newBool);
            }
            else
            {
                throw new System.InvalidCastException(
                    $"Couldn't initialize default variable {name} with value {value} as Bool");
            }
        }
        else if (type == Yarn.Types.Number)
        {
            float newNumber;
            if (float.TryParse(value, out newNumber))
            {
                // TODO: this won't work for different cultures (e.g. French write "0.53" as "0,53")
                SetValue(name, newNumber);
            }
            else
            {
                throw new System.InvalidCastException(
                    $"Couldn't initialize default variable {name} with value {value} as Number (Float)");
            }
        }
        else if (type == Yarn.Types.String)
        {
            SetValue(name, value); // no special type conversion required
        }
        else
        {
            throw new System.ArgumentOutOfRangeException($"Unsupported type {type.Name}");
        }
    }

    /// <summary>
    /// Throws a <see cref="System.ArgumentException"/> if <paramref
    /// name="variableName"/> is not a valid Yarn Spinner variable name.
    /// </summary>
    /// <param name="variableName">The variable name to test.</param>
    /// <exception cref="System.ArgumentException">Thrown when <paramref
    /// name="variableName"/> is not a valid variable name.</exception> 
    private void ValidateVariableName(string variableName)
    {
        if (variableName.StartsWith("$") == false)
        {
            throw new System.ArgumentException(
                $"{variableName} is not a valid variable name: Variable names must start with a '$'. (Did you mean to use '${variableName}'?)");
        }
    }

    public override void SetValue(string variableName, string stringValue)
    {
        ValidateVariableName(variableName);

        variables[variableName] = stringValue;
        variableTypes[variableName] = typeof(string);
    }

    public override void SetValue(string variableName, float floatValue)
    {
        ValidateVariableName(variableName);

        variables[variableName] = floatValue;
        variableTypes[variableName] = typeof(float);
    }

    public override void SetValue(string variableName, bool boolValue)
    {
        ValidateVariableName(variableName);

        variables[variableName] = boolValue;
        variableTypes[variableName] = typeof(bool);
    }

    private static bool TryGetAsType<T>(Dictionary<string, object> dictionary, string key, out T result)
    {
        if (dictionary.TryGetValue(key, out var objectResult) == true
            && typeof(T).IsAssignableFrom(objectResult.GetType()))
        {
            result = (T)objectResult;
            return true;
        }

        result = default;
        return false;
    }

    /// <summary>
    /// Retrieves a <see cref="Value"/> by name.
    /// </summary>
    /// <param name="variableName">The name of the variable to retrieve the
    /// value of. Don't forget to include the "$" at the beginning!</param>
    /// <returns>The <see cref="Value"/>. If a variable by the name of
    /// <paramref name="variableName"/> is not present, returns a value
    /// representing `null`.</returns>
    /// <exception cref="System.ArgumentException">Thrown when variableName
    /// is not a valid variable name.</exception>
    public override bool TryGetValue<T>(string variableName, out T result)
    {
        // Ensure that the variable name is valid.
        ValidateVariableName(variableName);

        switch (GetVariableKind(variableName))
        {
            case VariableKind.Stored:
                // This is a stored value. First, attempt to fetch it from
                // the variable storage.

                // Try to get the value from the dictionary, and check to
                // see that it's the 
                if (TryGetAsType(variables, variableName, out result))
                {
                    // We successfully fetched it from storage.
                    return true;
                }
                else
                {
                    return this.Program.TryGetInitialValue<T>(variableName, out result);
                }
            case VariableKind.Smart:
                // The variable is a smart variable. Find the node that
                // implements it, and use that to get the variable's current
                // value.

                // Update the VM's settings, since ours might have changed
                // since we created the VM.
                return this.SmartVariableEvaluator.TryGetSmartVariable(variableName, out result);
            case VariableKind.Unknown:
            default:
                // The variable is not known.
                result = default;
                return false;
        }
    }

    /// <summary>
    /// Example method to get a variable as a variant, so that this method can be called from GDScript.
    /// </summary>
    public Variant GetVariantValue(string variableName)
    {
        if (variables.TryGetValue(variableName, out var variable))
        {
            var type = variableTypes[variableName];
            if (type == typeof(float))
            {
                return Variant.From(System.Convert.ToSingle(variable));
            }

            if (type == typeof(string))
            {
                return Variant.From(System.Convert.ToString(variable));
            }

            if (type == typeof(bool))
            {
                return Variant.From(System.Convert.ToBoolean(variable));
            }

            GD.Print($"{variableName} is not a valid type");
        }
        else
        {
            GD.Print($"Could not find variable: {variableName}");
        }

        return new Variant();
    }

    /// <summary>
    /// Removes all variables from storage.
    /// </summary>
    public override void Clear()
    {
        variables.Clear();
        variableTypes.Clear();
    }

    #endregion

    /// <summary>
    /// returns a boolean value representing if the particular variable is
    /// inside the variable storage
    /// </summary>
    public override bool Contains(string variableName)
    {
        return variables.ContainsKey(variableName);
    }

    /// <summary>
    /// Returns an <see cref="IEnumerator{T}"/> that iterates over all
    /// variables in this object.
    /// </summary>
    /// <returns>An iterator over the variables.</returns>
    IEnumerator<KeyValuePair<string, object>> IEnumerable<KeyValuePair<string, object>>.GetEnumerator()
    {
        return ((IEnumerable<KeyValuePair<string, object>>)variables).GetEnumerator();
    }

    /// <summary>
    /// Returns an <see cref="IEnumerator"/> that iterates over all
    /// variables in this object.
    /// </summary>
    /// <returns>An iterator over the variables.</returns>
    IEnumerator IEnumerable.GetEnumerator()
    {
        return ((IEnumerable<KeyValuePair<string, object>>)variables).GetEnumerator();
    }

    #region Save/Load

    public override (Dictionary<string, float>, Dictionary<string, string>, Dictionary<string, bool>) GetAllVariables()
    {
        Dictionary<string, float> floatDict = new Dictionary<string, float>();
        Dictionary<string, string> stringDict = new Dictionary<string, string>();
        Dictionary<string, bool> boolDict = new Dictionary<string, bool>();

        foreach (var variable in variables)
        {
            var type = variableTypes[variable.Key];

            if (type == typeof(float))
            {
                float value = System.Convert.ToSingle(variable.Value);
                floatDict.Add(variable.Key, value);
            }
            else if (type == typeof(string))
            {
                string value = System.Convert.ToString(variable.Value);
                stringDict.Add(variable.Key, value);
            }
            else if (type == typeof(bool))
            {
                bool value = System.Convert.ToBoolean(variable.Value);
                boolDict.Add(variable.Key, value);
            }
            else
            {
                GD.Print($"{variable.Key} is not a valid type");
            }
        }

        return (floatDict, stringDict, boolDict);
    }

    public override void SetAllVariables(Dictionary<string, float> floats, Dictionary<string, string> strings,
        Dictionary<string, bool> bools, bool clear = true)
    {
        if (clear)
        {
            variables.Clear();
            variableTypes.Clear();
        }

        foreach (var value in floats)
        {
            SetValue(value.Key, value.Value);
        }

        foreach (var value in strings)
        {
            SetValue(value.Key, value.Value);
        }

        foreach (var value in bools)
        {
            SetValue(value.Key, value.Value);
        }

        GD.Print($"bulk loaded {floats.Count} floats, {strings.Count} strings, {bools.Count} bools");
    }

    #endregion
}