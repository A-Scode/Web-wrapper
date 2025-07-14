import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";

import { StatusBar } from "expo-status-bar";

import { useColorScheme } from "@/hooks/useColorScheme";
import { getApp } from "@react-native-firebase/app";
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
} from "@react-native-firebase/remote-config";
import { useEffect, useRef, useState } from "react";
import { BackHandler, Linking, StyleSheet, View } from "react-native";
import { ProgressBar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context"; // better
import { WebView } from "react-native-webview";
import SplashScreen from "../components/SplashScreen";

const app = getApp(); // gets the default Firebase app
const remoteConfig = getRemoteConfig(app);
remoteConfig.settings = {
  minimumFetchIntervalMillis: 0,
};

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
`;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const webviewRef: any = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const [open_url, setOpenUrl] = useState<null | string>(null);
  const [key, setKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [barColor, setBarColor] = useState("#0000ff");

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
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  useEffect(() => {
    fetchAndActivate(remoteConfig).then(() => {
      const remoteOpenUrl = getValue(remoteConfig, "is_browser").asBoolean();
      setBarColor(getValue(remoteConfig, "bar_color").asString());
      if (!remoteOpenUrl) {
        setOpenUrl(getValue(remoteConfig, "app_site_url").asString());
        setKey((prevKey) => prevKey + 1); // Increment key to force WebView reload
      } else {
        Linking.openURL(getValue(remoteConfig, "browser_site_url").asString());
      }
    });

    setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    // fetchAndActivate(remoteConfig).then(() => {
    //   const remoteOpenUrl = getValue(remoteConfig, "is_browser").asBoolean();
    //   setBarColor(getValue(remoteConfig, "bar_color").asString());
    //   if (!remoteOpenUrl) {
    //     let url = getValue(remoteConfig, "app_site_url").asString();
    //     if (!url || url === "null" || url.trim() === "") {
    //       url = "https://example.com"; // fallback dummy URL
    //     }
    //     console.log("WebView will load URL:", url);
    //     setOpenUrl(url);
    //     setKey((prevKey) => prevKey + 1); // Increment key to force WebView reload
    //   } else {
    //     const browserUrl = getValue(
    //       remoteConfig,
    //       "browser_site_url"
    //     ).asString();
    //     console.log("Opening external browser URL:", browserUrl);
    //     Linking.openURL(browserUrl);
    //   }
    // });

    // setOpenUrl("https://example.com");
    // setKey((prevKey) => prevKey + 1);
  }, []);

  if (showSplash) {
    return (
      <>
        <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
        <SplashScreen />
      </>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
      <SafeAreaView style={styles.container}>
        {loading && (
          <View
            style={[styles.progressBarContainer, { backgroundColor: barColor }]}
          >
            <ProgressBar
              progress={0.5}
              color="#0000ff"
              style={styles.progressBar}
            />
          </View>
        )}
        <WebView
          ref={webviewRef}
          key={key}
          source={open_url ? { uri: open_url } : { html: "" }}
          style={{ flex: 1 }}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          injectedJavaScript={injectedJS}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
            console.log("Navigation State:", navState);
          }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={(event) => {
            setLoading(false);
          }}
          originWhitelist={["*"]} // allow all
          setSupportMultipleWindows={false} // disable target="_blank"
          onShouldStartLoadWithRequest={(request) => {
            return true;
          }}
        />
      </SafeAreaView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  progressBarContainer: {
    position: "absolute",
    top: 40, // Position below the status bar
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#0000ff",
    justifyContent: "center",
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 4,
  },
});
