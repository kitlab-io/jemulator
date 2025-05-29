# YarnSpinner Integration Implementation Guide

## Custom Commands and Functions

### Minigame Integration Commands

```csharp
// Register custom commands in YarnSpinner
yarn.AddCommandHandler("trigger_minigame", TriggerMinigame);
yarn.AddCommandHandler("save_state", SaveGameState);
yarn.AddCommandHandler("load_state", LoadGameState);

// Custom functions for calculations
yarn.AddFunction("calculate_team_strength", CalculateTeamStrength);
yarn.AddFunction("get_puzzle_quality_average", GetPuzzleQualityAverage);
yarn.AddFunction("check_expedition_eligibility", CheckExpeditionEligibility);
```

### Minigame Command Implementation

```csharp
void TriggerMinigame(string gameType, params string[] parameters)
{
    MinigameData gameData = new MinigameData
    {
        Type = gameType,
        Parameters = ParseParameters(parameters),
        OnComplete = OnMinigameComplete
    };
    
    MinigameManager.Instance.StartMinigame(gameData);
}

void OnMinigameComplete(MinigameResult result)
{
    // Set YarnSpinner variable with result
    yarn.SetVariable("$puzzle_result", result.Score);
    
    // Update related skill variables
    UpdateSkillProgression(result.GameType, result.Score);
    
    // Continue story after minigame
    yarn.Continue();
}
```

## Variable Synchronization System

### Automatic Variable Updates

```csharp
public class RelationshipManager : MonoBehaviour
{
    private YarnProject yarnProject;
    private Dictionary<string, Action> relationshipUpdaters;
    
    void Start()
    {
        // Initialize relationship update functions
        relationshipUpdaters = new Dictionary<string, Action>
        {
            {"elowen", UpdateElowenRelationship},
            {"kai", UpdateKaiRelationship},
            {"nima", UpdateNimaRelationship},
            {"soren", UpdateSorenRelationship},
            {"juniper", UpdateJuniperRelationship},
            {"rowan", UpdateRowanRelationship},
            {"zephyr", UpdateZephyrRelationship}
        };
    }
    
    public void UpdateElowenRelationship()
    {
        var technical = yarn.GetVariable("$elowen_technical_respect").AsNumber;
        var trust = yarn.GetVariable("$elowen_trust").AsNumber;
        var collaboration = yarn.GetVariable("$elowen_collaboration").AsNumber;
        
        // Check for relationship milestones
        if (technical >= 80 && trust >= 60)
        {
            yarn.SetVariable("$elowen_trusts_with_contacts", true);
            yarn.SetVariable("$elowen_available_for_expedition", true);
        }
        
        if (collaboration >= 70)
        {
            yarn.SetVariable("$elowen_teaching_unlocked", true);
        }
    }
}
```

### Skill Progression Integration

```csharp
public class SkillProgressionManager : MonoBehaviour
{
    public void UpdateSkillProgression(string gameType, float score)
    {
        switch (gameType)
        {
            case "circuit_design":
                UpdateCircuitSkills(score);
                break;
            case "mechanical_assembly":
                UpdateMechanicalSkills(score);
                break;
            case "systems_integration":
                UpdateSystemsSkills(score);
                break;
        }
    }
    
    void UpdateCircuitSkills(float score)
    {
        var currentBasics = yarn.GetVariable("$circuit_basics").AsNumber;
        var currentAnalysis = yarn.GetVariable("$circuit_analysis").AsNumber;
        
        // Progressive skill advancement based on puzzle performance
        if (score >= 80)
        {
            yarn.SetVariable("$circuit_basics", Mathf.Min(100, currentBasics + 20));
            yarn.SetVariable("$circuit_analysis", Mathf.Min(100, currentAnalysis + 15));
        }
        else if (score >= 60)
        {
            yarn.SetVariable("$circuit_basics", Mathf.Min(100, currentBasics + 10));
            yarn.SetVariable("$circuit_analysis", Mathf.Min(100, currentAnalysis + 8));
        }
    }
}
```

## Puzzle Result Integration

### Quality Tracking System

```csharp
public class PuzzleQualityTracker : MonoBehaviour
{
    private Dictionary<string, float> puzzleResults = new Dictionary<string, float>();
    
    public void RecordPuzzleResult(string puzzleName, float quality)
    {
        puzzleResults[puzzleName] = quality;
        yarn.SetVariable($"${puzzleName}_quality", quality);
        
        // Update overall technical credibility
        UpdateTechnicalCredibility();
    }
    
    void UpdateTechnicalCredibility()
    {
        float averageQuality = puzzleResults.Values.Average();
        yarn.SetVariable("$technical_credibility", averageQuality);
        
        // Trigger relationship updates based on performance
        if (averageQuality >= 80)
        {
            TriggerHighPerformanceEvents();
        }
    }
}
```

## Dynamic Story Branching

### Context-Sensitive Node Selection

```csharp
public class StoryContextManager : MonoBehaviour
{
    public string GetContextualNode(string baseNode, Dictionary<string, object> context)
    {
        // Example: Select appropriate Elowen interaction based on relationship level
        if (baseNode == "ElowenInteraction")
        {
            var technicalRespect = yarn.GetVariable("$elowen_technical_respect").AsNumber;
            var trust = yarn.GetVariable("$elowen_trust").AsNumber;
            
            if (technicalRespect >= 70 && trust >= 60)
                return "ElowenAdvancedCollaboration";
            else if (technicalRespect >= 40)
                return "ElowenTechnicalDiscussion";
            else
                return "ElowenBasicInteraction";
        }
        
        return baseNode;
    }
}
```

### Ending Determination Logic

```csharp
public class EndingDetermination : MonoBehaviour
{
    public string DetermineEndingVariant()
    {
        var expeditionElowen = yarn.GetVariable("$expedition_elowen").AsBool;
        var expeditionSoren = yarn.GetVariable("$expedition_soren").AsBool;
        var expeditionNima = yarn.GetVariable("$expedition_nima").AsBool;
        var expeditionJuniper = yarn.GetVariable("$expedition_juniper").AsBool;
        var expeditionRowan = yarn.GetVariable("$expedition_rowan").AsBool;
        
        var technicalStrength = yarn.GetVariable("$expedition_technical_strength").AsNumber;
        var racingExpertise = yarn.GetVariable("$expedition_racing_expertise").AsNumber;
        var totalStrength = technicalStrength + racingExpertise;
        
        // Technical Dream Team
        if (expeditionElowen && expeditionSoren && expeditionNima && totalStrength >= 100)
        {
            yarn.SetVariable("$ending_variant", "technical_dream_team");
            return "TechnicalDreamTeamEnding";
        }
        
        // Balanced Expedition
        if (expeditionJuniper && expeditionRowan && expeditionSoren && racingExpertise >= 40)
        {
            yarn.SetVariable("$ending_variant", "balanced_expedition");
            return "BalancedExpeditionEnding";
        }
        
        // Underdog Alliance (default)
        yarn.SetVariable("$ending_variant", "underdog_alliance");
        return "UnderdogAllianceEnding";
    }
}
```

## Village Systems Integration

### Real-Time System Status Updates

```csharp
public class VillageSystemsManager : MonoBehaviour
{
    [Header("System Health Tracking")]
    public float powerGridHealth = 25f;
    public float irrigationHealth = 20f;
    public float communicationHealth = 50f;
    
    private Coroutine systemDegradationCoroutine;
    
    void Start()
    {
        // Sync initial values with YarnSpinner
        SyncSystemStatusToYarn();
        
        // Start gradual system degradation over time
        systemDegradationCoroutine = StartCoroutine(SystemDegradationLoop());
    }
    
    void SyncSystemStatusToYarn()
    {
        yarn.SetVariable("$power_grid_health", powerGridHealth);
        yarn.SetVariable("$irrigation_system", irrigationHealth);
        yarn.SetVariable("$village_network", communicationHealth);
    }
    
    IEnumerator SystemDegradationLoop()
    {
        while (true)
        {
            yield return new WaitForSeconds(300f); // 5 minutes real time
            
            // Gradual degradation if no repairs
            if (!IsBeingRepaired("power"))
                powerGridHealth = Mathf.Max(0, powerGridHealth - 2f);
            
            if (!IsBeingRepaired("irrigation"))
                irrigationHealth = Mathf.Max(0, irrigationHealth - 1.5f);
                
            SyncSystemStatusToYarn();
            
            // Trigger crisis events at critical thresholds
            CheckForCrisisEvents();
        }
    }
    
    public void RepairSystem(string systemType, float repairQuality)
    {
        float repairAmount = repairQuality * 0.4f; // Max 40 points per repair
        
        switch (systemType)
        {
            case "power_grid":
                powerGridHealth = Mathf.Min(100, powerGridHealth + repairAmount);
                break;
            case "irrigation":
                irrigationHealth = Mathf.Min(100, irrigationHealth + repairAmount);
                break;
            case "communication":
                communicationHealth = Mathf.Min(100, communicationHealth + repairAmount);
                break;
        }
        
        SyncSystemStatusToYarn();
    }
    
    void CheckForCrisisEvents()
    {
        if (powerGridHealth <= 10 && !yarn.GetVariable("$power_crisis_triggered").AsBool)
        {
            yarn.SetVariable("$power_crisis_triggered", true);
            TriggerStoryEvent("PowerCrisisEvent");
        }
        
        if (irrigationHealth <= 5 && !yarn.GetVariable("$water_crisis_triggered").AsBool)
        {
            yarn.SetVariable("$water_crisis_triggered", true);
            TriggerStoryEvent("WaterCrisisEvent");
        }
    }
}
```

## Minigame Integration Framework

### Circuit Building Minigame

```csharp
public class CircuitBuildingMinigame : MonoBehaviour
{
    [Header("Components Available")]
    public List<CircuitComponent> availableComponents;
    
    [Header("Puzzle Configuration")]
    public CircuitPuzzleConfig currentPuzzle;
    
    public class CircuitPuzzleResult
    {
        public float efficiency;
        public float reliability;
        public float costEffectiveness;
        public float overallScore;
        public List<string> achievements;
    }
    
    public void StartCircuitPuzzle(string puzzleType, List<string> componentTypes)
    {
        // Initialize puzzle based on YarnSpinner parameters
        SetupPuzzleForType(puzzleType);
        FilterAvailableComponents(componentTypes);
        
        // Show UI and begin player interaction
        ShowCircuitBuildingUI();
    }
    
    public CircuitPuzzleResult EvaluateCircuit(CircuitDesign playerDesign)
    {
        var result = new CircuitPuzzleResult();
        
        // Evaluate circuit correctness
        result.efficiency = CalculateEfficiency(playerDesign);
        result.reliability = CalculateReliability(playerDesign);
        result.costEffectiveness = CalculateCost(playerDesign);
        
        // Calculate overall score
        result.overallScore = (result.efficiency * 0.4f + 
                             result.reliability * 0.4f + 
                             result.costEffectiveness * 0.2f);
        
        // Check for special achievements
        result.achievements = CheckAchievements(playerDesign);
        
        return result;
    }
    
    void OnPuzzleComplete(CircuitPuzzleResult result)
    {
        // Update YarnSpinner variables with results
        yarn.SetVariable("$puzzle_result", result.overallScore);
        
        // Award relationship points based on performance and puzzle type
        if (currentPuzzle.mentorCharacter == "elowen")
        {
            float relationshipGain = result.overallScore * 0.2f;
            var currentRespect = yarn.GetVariable("$elowen_technical_respect").AsNumber;
            yarn.SetVariable("$elowen_technical_respect", 
                           Mathf.Min(100, currentRespect + relationshipGain));
        }
        
        // Continue YarnSpinner story
        yarn.Continue();
    }
}
```

### Mechanical Assembly Minigame

```csharp
public class MechanicalAssemblyMinigame : MonoBehaviour
{
    [Header("3D Assembly Interface")]
    public Transform assemblySpace;
    public List<MechanicalPart> availableParts;
    
    public class AssemblyResult
    {
        public float functionalCorrectness;
        public float efficiency;
        public float innovation;
        public float overallScore;
        public bool mechanismWorks;
    }
    
    public void StartAssemblyPuzzle(string assemblyType, List<string> partTypes)
    {
        // Setup 3D workspace for specific assembly challenge
        LoadAssemblyChallenge(assemblyType);
        PopulateAvailableParts(partTypes);
        
        EnableAssemblyMode();
    }
    
    public AssemblyResult EvaluateAssembly(MechanicalAssembly playerAssembly)
    {
        var result = new AssemblyResult();
        
        // Physics simulation to test functionality
        result.mechanismWorks = TestMechanismFunction(playerAssembly);
        result.functionalCorrectness = CalculateFunctionalScore(playerAssembly);
        result.efficiency = CalculateMechanicalEfficiency(playerAssembly);
        result.innovation = DetectInnovativeDesign(playerAssembly);
        
        result.overallScore = (result.functionalCorrectness * 0.5f +
                             result.efficiency * 0.3f +
                             result.innovation * 0.2f);
        
        return result;
    }
    
    bool TestMechanismFunction(MechanicalAssembly assembly)
    {
        // Run physics simulation to verify the mechanism works
        var simulation = new PhysicsSimulation(assembly);
        return simulation.TestFunctionality();
    }
}
```

## Character AI and Dialogue System

### Dynamic Character Responses

```csharp
public class CharacterAI : MonoBehaviour
{
    [Header("Character Configuration")]
    public CharacterProfile character;
    public DialoguePersonality personality;
    
    public string GenerateContextualResponse(string topic, Dictionary<string, float> relationshipValues)
    {
        // Select appropriate dialogue node based on relationship and context
        string baseResponse = GetBaseResponse(topic);
        
        // Modify response based on relationship levels
        if (character.name == "Elowen")
        {
            var technicalRespect = relationshipValues["technical_respect"];
            var trust = relationshipValues["trust"];
            
            if (technicalRespect >= 70)
                baseResponse = AddTechnicalDepth(baseResponse);
            
            if (trust >= 60)
                baseResponse = AddPersonalTouch(baseResponse);
        }
        
        return ApplyPersonalityFilters(baseResponse);
    }
    
    public List<string> GetAvailableTopics(Dictionary<string, float> relationshipValues)
    {
        var topics = new List<string> { "work", "village", "systems" };
        
        // Unlock personal topics based on relationship
        if (relationshipValues["trust"] >= 50)
            topics.Add("personal_history");
            
        if (relationshipValues["collaboration"] >= 60)
            topics.Add("future_plans");
            
        if (character.hasSpecialKnowledge && relationshipValues["respect"] >= 70)
            topics.Add("expert_knowledge");
            
        return topics;
    }
}
```

### Contextual Dialogue Selection

```csharp
public class DialogueContextManager : MonoBehaviour
{
    public string SelectDialogueNode(string characterName, string situation, GameContext context)
    {
        string baseNode = $"{characterName}_{situation}";
        
        // Add context modifiers
        if (context.timeOfDay == "evening" && context.location == "workshop")
            baseNode += "_workshop_evening";
        else if (context.recentEvent == "crisis_resolved")
            baseNode += "_post_crisis";
        else if (context.playerReputation >= 80)
            baseNode += "_high_reputation";
            
        // Check if node exists, fall back to base if not
        if (YarnNodeExists(baseNode))
            return baseNode;
        else
            return $"{characterName}_{situation}";
    }
    
    bool YarnNodeExists(string nodeName)
    {
        return yarn.NodeExists(nodeName);
    }
}
```

## Save/Load System Integration

### Comprehensive State Management

```csharp
public class GameStateManager : MonoBehaviour
{
    [System.Serializable]
    public class GameSaveData
    {
        // Story Progress
        public int chapterProgress;
        public string currentScene;
        public string timeOfDay;
        public int dayCounter;
        
        // Technical Skills
        public Dictionary<string, float> technicalSkills;
        
        // Character Relationships
        public Dictionary<string, Dictionary<string, float>> characterRelationships;
        
        // Village Systems
        public Dictionary<string, float> villageSystemHealth;
        
        // Puzzle Completion
        public Dictionary<string, bool> puzzlesCompleted;
        public Dictionary<string, float> puzzleQualityScores;
        
        // Inventory
        public Dictionary<string, int> inventory;
        
        // Story Flags
        public Dictionary<string, bool> storyFlags;
        public Dictionary<string, string> storyChoices;
        
        // Expedition Data
        public Dictionary<string, bool> expeditionTeam;
        public string endingVariant;
    }
    
    public void SaveGame(string saveSlot)
    {
        var saveData = new GameSaveData();
        
        // Collect all YarnSpinner variables
        saveData.chapterProgress = (int)yarn.GetVariable("$chapter_progress").AsNumber;
        saveData.currentScene = yarn.GetVariable("$current_scene").AsString;
        saveData.timeOfDay = yarn.GetVariable("$time_of_day").AsString;
        
        // Save technical skills
        saveData.technicalSkills = new Dictionary<string, float>
        {
            {"circuit_basics", yarn.GetVariable("$circuit_basics").AsNumber},
            {"circuit_analysis", yarn.GetVariable("$circuit_analysis").AsNumber},
            {"mechanical_basics", yarn.GetVariable("$mechanical_basics").AsNumber},
            {"systems_thinking", yarn.GetVariable("$systems_thinking").AsNumber}
            // ... continue for all skills
        };
        
        // Save character relationships
        saveData.characterRelationships = new Dictionary<string, Dictionary<string, float>>
        {
            ["elowen"] = new Dictionary<string, float>
            {
                {"technical_respect", yarn.GetVariable("$elowen_technical_respect").AsNumber},
                {"trust", yarn.GetVariable("$elowen_trust").AsNumber},
                {"collaboration", yarn.GetVariable("$elowen_collaboration").AsNumber}
            }
            // ... continue for all characters
        };
        
        // Serialize and save to file
        string json = JsonUtility.ToJson(saveData, true);
        File.WriteAllText(GetSaveFilePath(saveSlot), json);
    }
    
    public void LoadGame(string saveSlot)
    {
        string saveFilePath = GetSaveFilePath(saveSlot);
        if (!File.Exists(saveFilePath)) return;
        
        string json = File.ReadAllText(saveFilePath);
        var saveData = JsonUtility.FromJson<GameSaveData>(json);
        
        // Restore YarnSpinner variables
        yarn.SetVariable("$chapter_progress", saveData.chapterProgress);
        yarn.SetVariable("$current_scene", saveData.currentScene);
        yarn.SetVariable("$time_of_day", saveData.timeOfDay);
        
        // Restore technical skills
        foreach (var skill in saveData.technicalSkills)
        {
            yarn.SetVariable($"${skill.Key}", skill.Value);
        }
        
        // Restore character relationships
        foreach (var character in saveData.characterRelationships)
        {
            foreach (var relationship in character.Value)
            {
                yarn.SetVariable($"${character.Key}_{relationship.Key}", relationship.Value);
            }
        }
        
        // Resume from saved scene
        yarn.StartDialogue(saveData.currentScene);
    }
}
```

## Performance Optimization

### Variable Update Batching

```csharp
public class VariableUpdateBatcher : MonoBehaviour
{
    private Dictionary<string, object> pendingUpdates = new Dictionary<string, object>();
    private bool updateScheduled = false;
    
    public void BatchVariableUpdate(string variableName, object value)
    {
        pendingUpdates[variableName] = value;
        
        if (!updateScheduled)
        {
            updateScheduled = true;
            StartCoroutine(ApplyBatchedUpdates());
        }
    }
    
    IEnumerator ApplyBatchedUpdates()
    {
        // Wait for end of frame to batch multiple updates
        yield return new WaitForEndOfFrame();
        
        foreach (var update in pendingUpdates)
        {
            yarn.SetVariable($"${update.Key}", update.Value);
        }
        
        // Trigger any relationship calculations that depend on updated values
        yarn.CallFunction("UpdateAllRelationships");
        
        pendingUpdates.Clear();
        updateScheduled = false;
    }
}
```

## Integration Testing Framework

### Automated Story Flow Testing

```csharp
#if UNITY_EDITOR
public class StoryFlowTester : MonoBehaviour
{
    [Header("Test Configuration")]
    public List<StoryTestCase> testCases;
    
    [System.Serializable]
    public class StoryTestCase
    {
        public string name;
        public string startNode;
        public List<VariableSetup> initialVariables;
        public List<string> expectedChoices;
        public string expectedEndNode;
    }
    
    [ContextMenu("Run All Story Tests")]
    public void RunAllTests()
    {
        foreach (var testCase in testCases)
        {
            RunStoryTest(testCase);
        }
    }
    
    void RunStoryTest(StoryTestCase testCase)
    {
        Debug.Log($"Running test: {testCase.name}");
        
        // Setup initial conditions
        foreach (var variable in testCase.initialVariables)
        {
            yarn.SetVariable(variable.name, variable.value);
        }
        
        // Start dialogue and track progression
        yarn.StartDialogue(testCase.startNode);
        
        // Simulate player choices
        var actualChoices = new List<string>();
        while (yarn.IsDialogueRunning)
        {
            if (yarn.GetCurrentOptions().Length > 0)
            {
                actualChoices.AddRange(yarn.GetCurrentOptions().Select(opt => opt.Text));
                yarn.SelectOption(0); // Select first option for testing
            }
            yarn.Continue();
        }
        
        // Validate results
        bool testPassed = ValidateTestResults(testCase, actualChoices);
        Debug.Log($"Test {testCase.name}: {(testPassed ? "PASSED" : "FAILED")}");
    }
}
#endif
```

This comprehensive implementation provides:

1. **Full variable synchronization** between YarnSpinner and game systems
2. **Dynamic story branching** based on player performance and relationships
3. **Integrated minigame results** that affect story progression
4. **Real-time village system simulation** that impacts narrative
5. **Character AI** that responds contextually to relationship levels
6. **Robust save/load system** preserving all story and progression state
7. **Performance optimization** through batched updates
8. **Testing framework** for validating story flows

The system creates a seamless integration where technical learning, relationship building, and narrative progression all interconnect naturally, providing the rich, interconnected experience outlined in the original design.