using System;
using System.Reflection;

#nullable enable

namespace YarnSpinnerGodot;

public partial class DialogueRunner : IActionRegistration
{
    /// <inheritdoc />
    public void AddCommandHandler(string commandName, Delegate handler) =>
        CommandDispatcher.AddCommandHandler(commandName, handler);

    /// <inheritdoc />
    public void AddCommandHandler(string commandName, MethodInfo method) =>
        CommandDispatcher.AddCommandHandler(commandName, method);

    /// <inheritdoc />
    public void RemoveCommandHandler(string commandName) => CommandDispatcher.RemoveCommandHandler(commandName);


    /// <inheritdoc />
    public void AddFunction(string name, Delegate implementation) =>
        CommandDispatcher.AddFunction(name, implementation);

    /// <inheritdoc />
    public void RemoveFunction(string name) => CommandDispatcher.RemoveFunction(name);
}