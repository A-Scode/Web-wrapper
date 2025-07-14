import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";

const APP_ICON = require("../assets/images/icon.png"); // adjust path if needed
const APP_NAME = "Web Wrapper"; // change to your app name

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image source={APP_ICON} style={styles.icon} resizeMode="contain" />
      <Text style={styles.appName}>{APP_NAME}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    letterSpacing: 1,
  },
});
