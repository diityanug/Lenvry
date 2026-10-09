import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.contentCard}>
              <View style={styles.iconWrap}>
                <Ionicons name="warning-outline" size={36} color={COLORS.danger} />
              </View>

              <Text style={styles.title}>
                {this.props.fallbackTitle || 'Terjadi Kesalahan'}
              </Text>

              <Text style={styles.subtitle}>
                Aplikasi mengalami kendala tak terduga saat memuat komponen ini. Data Anda tetap aman.
              </Text>

              <View style={styles.errorBox}>
                <ScrollView
                  style={styles.errorScroll}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <Text style={styles.errorText} numberOfLines={4}>
                    {errorMessage}
                  </Text>
                  {__DEV__ && Boolean(componentStack) && (
                    <Text style={styles.stackText}>
                      {componentStack.trim().slice(0, 300)}
                    </Text>
                  )}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={styles.reloadBtn}
                onPress={this.handleReload}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={16} color="#08090C" style={styles.btnIcon} />
                <Text style={styles.reloadBtnText}>Muat Ulang Layar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contentCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(5, 6, 9, 0.6)',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 120,
    marginBottom: 24,
  },
  errorScroll: {
    maxHeight: 96,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: COLORS.danger,
    lineHeight: 16,
  },
  stackText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    marginTop: 6,
    lineHeight: 14,
  },
  reloadBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.finance,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    minHeight: 48,
  },
  btnIcon: {
    marginRight: 8,
  },
  reloadBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#08090C',
    letterSpacing: 0.2,
  },
});
