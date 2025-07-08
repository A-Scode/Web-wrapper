import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // better
import { WebView } from 'react-native-webview';
import remoteConfig from '@react-native-firebase/remote-config';



export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const webviewRef:any = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
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

  const [open_url, setOpenUrl] = useState('https://example.com');

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
    remoteConfig().fetchAndActivate()
      .then(() => {
        const remoteOpenUrl = remoteConfig().getValue('is_browser').asBoolean();
        if (!remoteOpenUrl) {
          setOpenUrl(remoteConfig().getValue('app_site_url').asString());
        }else{
          Linking.openURL(remoteConfig().getValue('browser_site_url').asString())
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
      <WebView
      ref={webviewRef}
        source={{ uri: open_url }}
        style={{ flex: 1 }}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedJS}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}

      />

      </SafeAreaView>
      <StatusBar style="inverted" animated translucent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});