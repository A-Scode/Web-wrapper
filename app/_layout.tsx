import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { getApp } from '@react-native-firebase/app';
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
} from '@react-native-firebase/remote-config';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // better
import { WebView } from 'react-native-webview';


const app = getApp(); // gets the default Firebase app
const remoteConfig = getRemoteConfig(app);
remoteConfig.settings = {
  minimumFetchIntervalMillis: 0,
}

const injectedJS = `
  const style = document.createElement('style');
  style.innerHTML = \`
    * {
      -webkit-tap-highlight-color: transparent !important;
      -webkit-user-select: none;
      user-select: text;
      transition : all 0.5s linear;
    }
    a:active {
      transform : scale(0.9);
    }

  \`;
  document.head.appendChild(style);
  true;
`;

const loader = `
<html>
  <head>
    <style>
    .loader {
    position: relative;
    width:  200px;
    height: 200px;
    background: #de3500;
    transform: rotateX(65deg) rotate(45deg);
    // remove bellows command for perspective change
    transform: perspective(200px) rotateX(65deg) rotate(45deg); 
    color: #363636;
    animation: layers1 1s linear infinite alternate;
  }
  .loader:after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.7);
    animation: layerTr 1s linear infinite alternate;
  }

  @keyframes layers1 {
    0% { box-shadow: 0px 0px 0 0px  }
   90% , 100% { box-shadow: 100px 100px 0 -4px  }
  }
  @keyframes layerTr {
    0% { transform:  translate(0, 0) scale(1) }
    100% {  transform: translate(-100px, -100px) scale(1) }
  }
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f0f0f0;
    }
    </style>
  </head>
  <body>
    <div class="loader"></div>
  </body>
</html>
`

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const webviewRef:any = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  
  const [open_url, setOpenUrl] = useState<null|string>(null);
  const [key , setKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // WebBrowser.getCustomTabsSupportingBrowsersAsync().then(data=>console.log(data))

  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true; // prevent default behavior
      }
      return false; // allow default behavior (exit app or screen)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  
  useEffect(() => {
    fetchAndActivate(remoteConfig)
      .then(() => {
        const remoteOpenUrl = getValue(remoteConfig ,'is_browser').asBoolean();


        if (!remoteOpenUrl) {
          setOpenUrl(getValue(remoteConfig,'app_site_url').asString());
          setKey(prevKey => prevKey + 1); // Increment key to force WebView reload
        }else{
          Linking.openURL(getValue(remoteConfig,'browser_site_url').asString())
        }
      })
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaView style={styles.container}>
        {loading && (
          <View style={styles.progressBarContainer}>
            <ActivityIndicator size="small" color="#0000ff" />
          </View>
        )}
        <WebView
          ref={webviewRef}
          key={key}
          source={open_url ? { uri: open_url } : { html: loader }}
          style={{ flex: 1 }}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          injectedJavaScript={injectedJS}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
      </SafeAreaView>
      <StatusBar style="auto" animated translucent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});