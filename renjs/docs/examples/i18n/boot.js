const globalConfig =  {
  'name': 'Quickstart',
  'w': 800,
  'h': 600,
  'renderer': Phaser.AUTO, // become renderer
  'scaleMode': Phaser.ScaleManager.NO_SCALE,
  parent: "renjs-canvas",
  'loadingScreen': {
    'background': 'assets/gui/quickstartbg.png',
    'loadingBar': {
      'asset': 'assets/gui/LANG/loaderloading-bar.png',
      'position': {
        'x': 109,
        'y': 458
      },
      'size': {
        'w': 578,
        'h': 82
      }
    }
  },
  'logChoices': true,
  'fonts': 'assets/gui/fonts.css',
  'guiConfig': 'i18n/LANG/GUI.yaml',
  'storyConfig': 'Config.yaml',
  storySetup: 'i18n/Setup.yaml',
  'storyText': [
    'i18n/LANG/Story.yaml'
  ],
  i18n: {
    background: 'assets/gui/quickstartbg.png',
    langs: {
      "en": {
        'asset': 'assets/gui/i18n/en.png',
        'position': {
          'x': 200,
          'y': 458
        },
        'size': {
          'w': 163,
          'h': 83
        }
      },
      "es":{
        'asset': 'assets/gui/i18n/es.png',
        'position': {
          'x': 450,
          'y': 458
        },
        'size': {
          'w': 163,
          'h': 83
        }
      }}
  },
}

const RenJSGame = new RenJS.game(globalConfig)
RenJSGame.launch()
