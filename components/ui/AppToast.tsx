import React from "react";
import { View, Text, StyleSheet } from "react-native";

type ToastType = "success" | "error" | "warning" | "info";

type AppToastProps = {
  visible: boolean;
  message: string;
  type?: ToastType;
};

export default function AppToast({
  visible,
  message,
  type = "info",
}: AppToastProps) {
  if (!visible) return null;

  return (
    <View style={[styles.toast, styles[type]]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 12,
    zIndex: 999,
  },
  text: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  success: {
    backgroundColor: "#16a34a",
  },
  error: {
    backgroundColor: "#dc2626",
  },
  warning: {
    backgroundColor: "#f59e0b",
  },
  info: {
    backgroundColor: "#2563eb",
  },
});