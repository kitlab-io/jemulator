/*
Yarn Spinner is licensed to you under the terms found in the file LICENSE.md.
*/

using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.Reflection;
using System.Threading.Tasks;
using Godot;
using Yarn;
using Node = Godot.Node;


#nullable enable

namespace YarnSpinnerGodot;

using ActionRegistrationMethod = System.Action<IActionRegistration, RegistrationType>;
using Converter = System.Func<string, int, object?>;

public enum RegistrationType
{
    /// <summary>
    /// Actions are being registered during a Yarn script compilation.
    /// </summary>
    Compilation,

    /// <summary>
    /// Actions are being registered for runtime use (i.e. during gameplay.)
    /// </summary>
    Runtime
}

public interface ICommand
{
    string Name { get; }
}

internal static class DiagnosticUtility
{
    public static string EnglishPluraliseNounCount(int count, string name, bool prefixCount = false)
    {
        string result;
        if (count == 1)
        {
            result = name;
        }
        else
        {
            result = name + "s";
        }

        if (prefixCount)
        {
            return count.ToString() + " " + result;
        }
        else
        {
            return result;
        }
    }

    public static string EnglishPluraliseWasVerb(int count)
    {
        if (count == 1)
        {
            return "was";
        }
        else
        {
            return "were";
        }
    }
}

public class Actions : ICommandDispatcher
{
    internal class CommandRegistration : ICommand
    {
        public CommandRegistration(string name, Delegate @delegate)
        {
            Name = name;
            Method = @delegate.Method;
            Target = @delegate.Target;
            Converters = CreateConverters(Method);
            DynamicallyFindsTarget = false;
        }

        public CommandRegistration(string name, MethodInfo method)
        {
            if (method.IsStatic)
            {
                DynamicallyFindsTarget = false;
            }
            else if (typeof(Node).IsAssignableFrom(method.DeclaringType))
            {
                // This method is an instance method on a Node (or one
                // of its subclasses). We'll dynamically find a target to
                // invoke the method on at runtime.
                DynamicallyFindsTarget = true;
            }
            else
            {
                // The instance method's declaring type is not a Node,
                // which means we won't be able to look up a target.
                throw new ArgumentException(
                    $"Cannot register method {GetFullMethodName(method)} as a command: instance methods must declared on {nameof(Node)} classes.");
            }

            Name = name;
            Method = method;
            Target = null;

            Converters = CreateConverters(method);
        }

        public string Name { get; set; }
        public MethodInfo Method { get; set; }
        private object? Target { get; set; }

        public Type DeclaringType => Method.DeclaringType!;
        public Type ReturnType => Method.ReturnType;
        public bool IsStatic => Method.IsStatic;

        public readonly Converter[] Converters;

        /// <summary>
        /// Gets a value indicating that this command finds a target to
        /// invoke its method on by name, each time it is invoked.
        /// </summary>
        private bool DynamicallyFindsTarget { get; }

        public CommandType Type
        {
            get
            {
                Type returnType = ReturnType;

                if (typeof(void).IsAssignableFrom(returnType))
                {
                    return CommandType.IsVoid;
                }

                if (typeof(IEnumerator).IsAssignableFrom(returnType))
                {
                    return CommandType.IsCoroutine;
                }

                if (typeof(Task).IsAssignableFrom(returnType))
                {
                    return CommandType.ReturnsTask;
                }

                return CommandType.Invalid;
            }
        }

        public enum CommandType
        {
            /// <summary>
            /// The method returns <see cref="void"/>.
            /// </summary>
            IsVoid,

            /// <summary>
            /// The method returns a <see cref="Task"/> object.
            /// </summary>
            /// <remarks>
            ReturnsTask,

            /// <summary>
            /// The method returns <see cref="IEnumerator"/> (that is, it is
            /// a coroutine).
            /// </summary>
            /// <remarks>
            /// Code that invokes this command should use <see
            /// cref="MonoBehaviour.StartCoroutine(IEnumerator)"/> to begin
            /// the coroutine.
            /// </remarks>
            IsCoroutine,

            /// <summary>
            /// The method is not a valid command (that is, it does not
            /// return <see cref="void"/>, <see cref="Coroutine"/>, or <see
            /// cref="IEnumerator"/>.)
            /// </summary>
            Invalid,
        }

        /// <summary>
        /// Attempt to parse the arguments with cached converters.
        /// </summary>
        public CommandDispatchResult.ParameterParseStatusType TryParseArgs(string[] args, out object?[]? result,
            out string? message)
        {
            var parameters = Method.GetParameters();

            var (min, max) = ParameterCount;

            int argumentCount = args.Length;
            if (argumentCount < min || argumentCount > max)
            {
                // Wrong number of arguments.
                string requirementDescription;
                if (min == 0)
                {
                    requirementDescription =
                        $"at most {max} {DiagnosticUtility.EnglishPluraliseNounCount(max, "parameter")}";
                }
                else if (min != max)
                {
                    requirementDescription =
                        $"between {min} and {max} {DiagnosticUtility.EnglishPluraliseNounCount(max, "parameter")}";
                }
                else
                {
                    requirementDescription = $"{min} {DiagnosticUtility.EnglishPluraliseNounCount(max, "parameter")}";
                }

                message =
                    $"{this.Name} requires {requirementDescription}, but {argumentCount} {DiagnosticUtility.EnglishPluraliseWasVerb(argumentCount)} provided.";
                result = default;
                return CommandDispatchResult.ParameterParseStatusType.InvalidParameterCount;
            }

            var finalArgs = new object?[parameters.Length];

            var argsQueue = new Queue(args);

            for (int i = 0; i < argumentCount; i++)
            {
                var parameterIsParamsArray = parameters[i].GetCustomAttribute<ParamArrayAttribute>() != null;

                string arg = args[i];
                Converter converter = Converters[i];

                if (parameterIsParamsArray)
                {
                    // Consume all remaining arguments, passing them through
                    // the final converter, and produce an array from the
                    // results. This array will be the final parameter to
                    // the method.
                    var parameterArrayElementType = parameters[i].ParameterType.GetElementType();
                    var paramIndex = i;
                    // var paramsArray = new List<object?>();
                    var paramsArray = Array.CreateInstance(parameterArrayElementType!, argumentCount - i);
                    while (i < argumentCount)
                    {
                        arg = args[i];
                        if (converter == null)
                        {
                            paramsArray.SetValue(arg, i);
                        }
                        else
                        {
                            try
                            {
                                paramsArray.SetValue(converter.Invoke(arg, i), i - paramIndex);
                            }
                            catch (Exception e)
                            {
                                message =
                                    $"Can't convert parameter {i} to {parameterArrayElementType!.Name}: {e.Message}";
                                result = default;
                                return CommandDispatchResult.ParameterParseStatusType.InvalidParameterType;
                            }
                        }

                        i += 1;
                    }

                    finalArgs[paramIndex] = paramsArray;
                }
                else
                {
                    // Consume a single argument
                    if (converter == null)
                    {
                        finalArgs[i] = arg;
                    }
                    else
                    {
                        try
                        {
                            finalArgs[i] = converter.Invoke(arg, i);
                        }
                        catch (Exception e)
                        {
                            message = $"Can't convert parameter {i} to {parameters[i].ParameterType.Name}: {e.Message}";
                            result = default;
                            return CommandDispatchResult.ParameterParseStatusType.InvalidParameterType;
                        }
                    }
                }
            }

            for (int i = argumentCount; i < finalArgs.Length; i++)
            {
                var parameter = parameters[i];
                if (parameter.IsOptional)
                {
                    // If this parameter is optional, provide the Missing
                    // type.
                    finalArgs[i] = System.Type.Missing;
                }
                else if (parameter.GetCustomAttribute<ParamArrayAttribute>() != null)
                {
                    // If the parameter is a params array, provide an empty
                    // array of the appropriate type.
                    finalArgs[i] = Array.CreateInstance(parameter.ParameterType!.GetElementType()!, 0);
                }
                else
                {
                    throw new InvalidOperationException(
                        $"Can't provide a default value for parameter {parameter.Name}");
                }
            }

            result = finalArgs;
            message = default;
            return CommandDispatchResult.ParameterParseStatusType.Succeeded;
        }

        private (int Min, int Max) ParameterCount
        {
            get
            {
                var parameters = Method.GetParameters();
                int optional = 0;
                bool lastCommandIsParams = false;
                foreach (var parameter in parameters)
                {
                    if (parameter.IsOptional)
                    {
                        optional += 1;
                    }

                    if (parameter.ParameterType.IsArray && parameter.GetCustomAttribute<ParamArrayAttribute>() != null)
                    {
                        // If the parameter is a params array, then:
                        // 1. It's 'optional' in that you can pass in no
                        //    values (so, for our purposes, the minimum
                        //    number of parameters you need to pass is not
                        //    changed)
                        // 2. The maximum number of parameters you can pass
                        //    is now effectively unbounded.
                        lastCommandIsParams = true;
                        optional += 1;
                    }
                }

                int min = parameters.Length - optional;
                int max = parameters.Length;
                if (lastCommandIsParams)
                {
                    max = int.MaxValue;
                }

                return (min, max);
            }
        }

        internal CommandDispatchResult Invoke(Godot.Node dispatcher, List<string> parameters)
        {
            object? target;

            if (DynamicallyFindsTarget)
            {
                // We need to find a target to call this method on.

                if (parameters.Count == 0)
                {
                    // We need at least one parameter, which is the
                    // component to look for
                    return new CommandDispatchResult(CommandDispatchResult.StatusType.InvalidParameterCount,
                        YarnTask.CompletedTask)
                    {
                        Message = $"{this.Name} needs a target, but none was specified",
                    };
                }

                // First parameter is the name of a game object that has the
                // component we're trying to call.

                var gameObjectName = parameters[0];

                parameters.RemoveAt(0);

                var gameObject = DialogueRunner.FindChild(gameObjectName);

                if (gameObject == null)
                {
                    // We couldn't find a target with this name.
                    return new CommandDispatchResult(CommandDispatchResult.StatusType.TargetMissingComponent)
                    {
                        Message = $"No game object named \"{gameObjectName}\" exists",
                    };
                }

                // We've found a target.  Does it have a childthat's
                // the right type of object to call the method on?
                var targetComponent = gameObject.GetType().IsAssignableTo(this.DeclaringType)
                    ? gameObject
                    : FindTypedNodeInChildren(gameObject, this.DeclaringType);

                if (!GodotObject.IsInstanceValid(targetComponent))
                {
                    return new CommandDispatchResult(CommandDispatchResult.StatusType.TargetMissingComponent)
                    {
                        Message =
                            $"{this.Name} can't be called on {gameObjectName}, because it doesn't have a {this.DeclaringType.Name}",
                    };
                }

                target = targetComponent;
            }
            else if (Method.IsStatic)
            {
                // The method is static; it therefore doesn't need a target.
                target = null;
            }
            else if (Target != null)
            {
                // The method is an instance method, so use the target we've
                // stored.
                target = Target;
            }
            else
            {
                // We don't know what to call this method on.
                throw new InvalidOperationException(
                    $"Internal error: {nameof(CommandRegistration)} \"{this.Name}\" has no {nameof(Target)}, but method is not static and ${DynamicallyFindsTarget} is false");
            }

            var parseArgsStatus =
                this.TryParseArgs(parameters.ToArray(), out var finalParameters, out var errorMessage);

            if (parseArgsStatus != CommandDispatchResult.ParameterParseStatusType.Succeeded)
            {
                var status = parseArgsStatus switch
                {
                    CommandDispatchResult.ParameterParseStatusType.Succeeded => CommandDispatchResult.StatusType
                        .Succeeded,
                    CommandDispatchResult.ParameterParseStatusType.InvalidParameterType => CommandDispatchResult
                        .StatusType.InvalidParameter,
                    CommandDispatchResult.ParameterParseStatusType.InvalidParameterCount => CommandDispatchResult
                        .StatusType.InvalidParameterCount,
                    _ => throw new InvalidOperationException("Internal error: invalid parameter parse result " +
                                                             parseArgsStatus),
                };

                return new CommandDispatchResult(status)
                {
                    Message = errorMessage,
                };
            }

            var returnValue = this.Method.Invoke(target, finalParameters);

            if (returnValue is System.Threading.Tasks.Task task)
            {
                // The method returned a task. Convert it to a YarnTask.
                return new CommandDispatchResult(
                    CommandDispatchResult.StatusType.Succeeded,
                    task
                );
            }
            else
            {
                // The method returned no value.
                return new CommandDispatchResult(CommandDispatchResult.StatusType.Succeeded);
            }
        }

        public string UsageString
        {
            get
            {
                var components = new List<string>();

                components.Add(Name);

                if (DynamicallyFindsTarget)
                {
                    var declaringTypeName = DeclaringType.Name;
                    components.Add($"target <i>({declaringTypeName})</i>");
                }

                foreach (var parameter in Method.GetParameters())
                {
                    var type = parameter.ParameterType;
                    string? typeName;

                    if (TypeFriendlyNames.TryGetValue(type, out typeName) == false)
                    {
                        typeName = type.Name;
                    }

                    string displayName = $"{parameter.Name} <i>({typeName})</i>";

                    if (parameter.IsOptional)
                    {
                        displayName = $"[{displayName} = {parameter.DefaultValue}]";
                    }

                    components.Add(displayName);
                }

                return string.Join(" ", components);
            }
        }

        readonly Dictionary<Type, string> TypeFriendlyNames = new Dictionary<Type, string>
        {
            {typeof(int), "number"},
            {typeof(float), "number"},
            {typeof(double), "number"},
            {typeof(Decimal), "number"},
            {typeof(string), "string"},
            {typeof(bool), "bool"},
        };
    }

    private Dictionary<string, CommandRegistration> _commands = new Dictionary<string, CommandRegistration>();

    public Library Library { get; }
    public IActionRegistration ActionRegistrar { get; }

    public IEnumerable<ICommand> Commands => _commands.Values;

    public Actions(IActionRegistration actionRegistrar, Library library)
    {
        Library = library;
        ActionRegistrar = actionRegistrar;
    }

    private static string GetFullMethodName(MethodInfo method)
    {
        return $"{method.DeclaringType?.FullName}.{method.Name}";
    }

    public void RegisterActions()
    {
        foreach (var registrationFunction in ActionRegistrationMethods)
        {
            registrationFunction.Invoke(ActionRegistrar, RegistrationType.Runtime);
        }
    }

    public void AddCommandHandler(string commandName, Delegate handler)
    {
        if (_commands.ContainsKey(commandName))
        {
            GD.PushError(
                $"Failed to register command {commandName}: a command by this name has already been registered.");
            return;
        }
        else
        {
#if YARN_SOURCE_GENERATION_DEBUG_LOGGING
            GD.Print($"Registering command {commandName}");
#endif
            _commands.Add(commandName, new CommandRegistration(commandName, handler));
        }
    }

    public void AddFunction(string name, Delegate implementation)
    {
        if (Library.FunctionExists(name))
        {
            GD.PushError($"Cannot add function {name}: one already exists");
            return;
        }
#if YARN_SOURCE_GENERATION_DEBUG_LOGGING
        GD.Print(
            $"Registering command {name} from method {implementation.Method.DeclaringType?.FullName}.{implementation.Method.Name}");
#endif

        Library.RegisterFunction(name, implementation);
    }

    public void AddCommandHandler(string commandName, MethodInfo methodInfo)
    {
        if (_commands.ContainsKey(commandName))
        {
            GD.PushError(
                $"Failed to register command {commandName}: a command by this name has already been registered.");
            return;
        }
        else
        {
            _commands.Add(commandName, new CommandRegistration(commandName, methodInfo));
        }
    }

    public void RemoveCommandHandler(string commandName)
    {
        if (_commands.Remove(commandName) == false)
        {
            GD.PushError(
                $"Can't remove command {commandName}, because no command with this name is currently registered.");
        }
    }

    public void RemoveFunction(string name)
    {
        if (Library.FunctionExists(name) == false)
        {
            GD.PushError($"Cannot remove function {name}: no function with that name exists in the library");
            return;
        }

        Library.DeregisterFunction(name);
    }

    public void SetupForProject(YarnProject yarnProject)
    {
        // no-op
    }

    CommandDispatchResult ICommandDispatcher.DispatchCommand(string command, Godot.Node coroutineHost)
    {
        var commandPieces = new List<string>(DialogueRunner.SplitCommandText(command));

        if (commandPieces.Count == 0)
        {
            // No text was found inside the command, so we won't be able to
            // find it.
            return new CommandDispatchResult(CommandDispatchResult.StatusType.CommandUnknown, YarnTask.CompletedTask);
        }

        if (_commands.TryGetValue(commandPieces[0], out var registration))
        {
            // The first part of the command is the command name itself.
            // Remove it to get the collection of parameters that were
            // passed to the command.
            commandPieces.RemoveAt(0);

            return registration.Invoke(coroutineHost, commandPieces);
        }
        else
        {
            return new CommandDispatchResult(CommandDispatchResult.StatusType.CommandUnknown);
        }
    }

    private static Converter[] CreateConverters(MethodInfo method)
    {
        ParameterInfo[] parameterInfos = method.GetParameters();

        Converter[] result = new Converter[parameterInfos.Length];

        int i = 0;

        foreach (var parameterInfo in parameterInfos)
        {
            result[i] = CreateConverter(parameterInfo, i);
            i++;
        }

        return result;
    }

    private static System.Func<string, int, object?> CreateConverter(ParameterInfo parameter, int index)
    {
        var targetType = parameter.ParameterType;
        string name = parameter.Name!;
        var parameterIsParamsArray = parameter.GetCustomAttribute<ParamArrayAttribute>() != null;

        if (targetType.IsArray && parameterIsParamsArray)
        {
            // This parameter is a params array. Make a converter for that
            // array's element type; at dispatch time, we'll repeatedly call
            // it with the arguments found in the command.

            var paramsArrayType = targetType.GetElementType();
            var elementConverter = CreateConverterFunction(paramsArrayType!, name);
            return elementConverter;
        }
        else
        {
            // This parameter is for a single value. Make a converter that
            // receives a single string, 
            return CreateConverterFunction(targetType, name);
        }
    }

    private static Converter CreateConverterFunction(Type targetType, string parameterName)
    {
        // well, I mean...
        if (targetType == typeof(string))
        {
            return (arg, i) => arg;
        }

        // find the Node with the handler
        if (typeof(Node).IsAssignableFrom(targetType))
        {
            return (arg, i) =>
            {
                Godot.Node gameObject = DialogueRunner.FindChild(arg);
                if (!GodotObject.IsInstanceValid(gameObject))
                {
                    return null;
                }

                return FindTypedNodeInChildren(gameObject, targetType);
            };
        }

        // bools can take "true" or "false", or the parameter name.
        if (typeof(bool).IsAssignableFrom(targetType))
        {
            return (arg, i) =>
            {
                // If the argument is the name of the parameter, interpret
                // the argument as 'true'.
                if (arg.Equals(parameterName, StringComparison.InvariantCultureIgnoreCase))
                {
                    return true;
                }

                // If the argument can be parsed as boolean true or false,
                // return that result.
                if (bool.TryParse(arg, out bool res))
                {
                    return res;
                }

                // We can't parse the argument.
                throw new ArgumentException(
                    $"Can't convert the given parameter at position {i + 1} (\"{arg}\") to parameter " +
                    $"{parameterName} of type {typeof(bool).FullName}.");
            };
        }

        // Fallback: try converting using IConvertible.
        return (arg, i) =>
        {
            try
            {
                if (targetType == typeof(Variant))
                {
                    var nullableType = Nullable.GetUnderlyingType(arg.GetType());
                    if (nullableType == null)
                    {
                        return Variant.From(arg);
                    }
                    // It's nullable, convert it to non-nullable for GDScript compatibility.
                    return Variant.From(Convert.ChangeType(arg, nullableType));
                }

                return Convert.ChangeType(arg, targetType, CultureInfo.InvariantCulture);
            }
            catch (Exception e)
            {
                throw new ArgumentException(
                    $"Can't convert the given parameter at position {i + 1} (\"{arg}\") to parameter " +
                    $"{parameterName} of type {targetType.FullName}: {e}", e);
            }
        };
    }

    private static Godot.Node? FindTypedNodeInChildren(Godot.Node node, Type type)
    {
        if (type.IsInstanceOfType(node))
        {
            return node;
        }

        for (var i = 0; i < node.GetChildCount(); i++)
        {
            var child = node.GetChild(i);
            var childResult = FindTypedNodeInChildren(child, type);
            if (childResult != null)
            {
                return childResult;
            }
        }

        return null;
    }

    internal static HashSet<ActionRegistrationMethod> ActionRegistrationMethods =
        new HashSet<ActionRegistrationMethod>();


    public static void AddRegistrationMethod(ActionRegistrationMethod registerActions)
    {
        ActionRegistrationMethods.Add(registerActions);
    }

    public static Yarn.Library GetLibrary()
    {
        var library = new Yarn.Library();

        var proxy = new LibraryRegistrationProxy(library);

        foreach (var registrationMethod in ActionRegistrationMethods)
        {
            registrationMethod.Invoke(proxy, RegistrationType.Compilation);
        }

        return library;
    }

    public void AddCommandHandler(string commandName, Func<object> handler)
    {
        this.AddCommandHandler(commandName, (Delegate) handler);
    }

    /// <summary>
    /// A helper class that registers functions into a <see
    /// cref="Yarn.Library"/>.
    /// </summary>
    private class LibraryRegistrationProxy : IActionRegistration
    {
        private Library library;

        public LibraryRegistrationProxy(Library library)
        {
            this.library = library;
        }

        public void AddCommandHandler(string commandName, Delegate handler)
        {
            // No action; this class does not handle commands, only
            // functions.
            return;
        }

        public void AddCommandHandler(string commandName, MethodInfo methodInfo)
        {
            // No action; this class does not handle commands, only
            // functions.
            return;
        }

        public void AddFunction(string name, Delegate implementation)
        {
            // Check to see if the function already exists in our Library,
            // and error out if it does
            if (library.FunctionExists(name))
            {
                throw new ArgumentException(
                    $"Cannot register function {name}: a function with this name already exists");
            }

            // Register this function in the library
            library.RegisterFunction(name, implementation);
        }

        public void RemoveCommandHandler(string commandName) =>
            throw new InvalidOperationException("This class does not support removing actions.");

        public void RemoveFunction(string name) =>
            throw new InvalidOperationException("This class does not support removing actions.");
    }
}