namespace GDScriptInterop {

	using YarnSpinnerGodot;

	[System.CodeDom.Compiler.GeneratedCode("YarnSpinner", "0.3.0")]
	public partial class YarnVariables : YarnSpinnerGodot.InMemoryVariableStorage, YarnSpinnerGodot.IGeneratedVariableStorage {
		// Accessor for String $myVariableSetFromGDScript
		public string MyVariableSetFromGDScript {
			get => this.GetValueOrDefault<string>("$myVariableSetFromGDScript");
			set => this.SetValue<string>("$myVariableSetFromGDScript", value);
		}

	}
}
