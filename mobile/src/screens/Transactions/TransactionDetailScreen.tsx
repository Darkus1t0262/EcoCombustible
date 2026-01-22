import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import type { PremiumTokens } from '../../theme/premium';
import { getPremiumTokens } from '../../theme/premium';
import { TransactionItem, TransactionService } from '../../services/TransactionService';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';
import { Skeleton } from '../../components/Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

const statusColor = (status: string, colors: ThemeColors) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('infracci')) {
    return colors.error;
  }
  if (normalized.includes('observaci')) {
    return colors.warning;
  }
  return colors.success;
};

const riskColor = (label: string | null | undefined, colors: ThemeColors) => {
  if (label === 'high') {
    return colors.error;
  }
  if (label === 'medium') {
    return colors.warning;
  }
  if (label === 'low') {
    return colors.success;
  }
  return colors.textLight;
};

const riskLabelText = (label?: string | null) => {
  if (label === 'high') {
    return 'Alto';
  }
  if (label === 'medium') {
    return 'Medio';
  }
  if (label === 'low') {
    return 'Bajo';
  }
  if (label === 'unknown') {
    return 'Pendiente';
  }
  return 'Sin evaluar';
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '--';
  }
  return value.replace('T', ' ').slice(0, 16);
};

const formatScore = (score?: number | null) => {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return '--';
  }
  return `${Math.round(score * 100)}%`;
};

export default function TransactionDetailScreen({ route, navigation }: any) {
  const { colors, resolvedMode } = useTheme();
  const tokens = useMemo(() => getPremiumTokens(colors, resolvedMode), [colors, resolvedMode]);
  const styles = useMemo(() => createStyles(colors, tokens), [colors, tokens]);
  const insets = useSafeAreaInsets();
  const { transactionId } = route.params;
  const [transaction, setTransaction] = useState<TransactionItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await TransactionService.getTransaction(transactionId);
        setTransaction(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [transactionId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={tokens.backgroundColors} style={styles.background} />
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <PressableScale
            onPress={() => navigation.goBack()}
            style={styles.headerAction}
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </PressableScale>
          <View style={styles.headerText}>
            <Text style={[styles.title, { fontFamily: titleFont }]}>Transacción</Text>
            <Text style={styles.subtitle}>Detalle y evaluación IA</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <LinearGradient
              colors={tokens.stripeColors}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardStripes}
            />
            <Skeleton width="45%" height={14} />
            <Skeleton width="80%" height={10} style={{ marginTop: 12 }} />
            <Skeleton width="60%" height={10} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.card}>
            <LinearGradient
              colors={tokens.stripeColors}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardStripes}
            />
            <Skeleton width="35%" height={14} />
            <Skeleton width="50%" height={10} style={{ marginTop: 12 }} />
            <Skeleton width="50%" height={10} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.card}>
            <LinearGradient
              colors={tokens.stripeColors}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardStripes}
            />
            <Skeleton width="40%" height={14} />
            <Skeleton width="55%" height={10} style={{ marginTop: 12 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.error }}>Transacción no encontrada.</Text>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: colors.white }}>Volver</Text>
        </PressableScale>
      </View>
    );
  }

  const analysisTone = transaction.analysis?.status ? statusColor(transaction.analysis.status, colors) : colors.textLight;
  const riskTone = riskColor(transaction.riskLabel, colors);

  return (
    <View style={styles.container}>
      <LinearGradient colors={tokens.backgroundColors} style={styles.background} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <PressableScale
          onPress={() => navigation.goBack()}
          style={styles.headerAction}
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </PressableScale>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Transacción</Text>
          <Text style={styles.subtitle}>Detalle y evaluación IA</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <ScreenReveal delay={80}>
          <View style={styles.card}>
            <LinearGradient
              colors={tokens.stripeColors}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardStripes}
            />
            <Text style={styles.sectionTitle}>Resumen</Text>
            <Text style={styles.metaText}>Estación: {transaction.stationName ?? 'No disponible'}</Text>
            <Text style={styles.metaText}>Vehículo: {transaction.vehiclePlate ?? 'No disponible'}</Text>
            <Text style={styles.metaText}>Fecha: {formatDate(transaction.occurredAt)}</Text>
          </View>
       </ScreenReveal>

        <ScreenReveal delay={120}>
          <View style={styles.card}>
            <LinearGradient
              colors={tokens.stripeColors}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardStripes}
            />
            <Text style={styles.sectionTitle}>Consumo</Text>
            <Text style={styles.metaText}>Litros: {transaction.liters}</Text>
            <Text style={styles.metaText}>Precio unitario: ${transaction.unitPrice}</Text>
            <Text style={styles.metaText}>Total: ${transaction.totalAmount.toFixed(2)}</Text>
            {!!transaction.paymentMethod && <Text style={styles.metaText}>Pago: {transaction.paymentMethod}</Text>}
            {!!transaction.reportedBy && <Text style={styles.metaText}>Fuente: {transaction.reportedBy}</Text>}
          </View>
        </ScreenReveal>

        {!!transaction.analysis && (
          <ScreenReveal delay={160}>
            <View style={styles.card}>
              <LinearGradient
                colors={tokens.stripeColors}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardStripes}
              />
              <Text style={styles.sectionTitle}>Análisis</Text>
              <View style={[styles.pill, { backgroundColor: `${analysisTone}1A`, borderColor: `${analysisTone}33` }]}>
                <Text style={[styles.pillText, { color: analysisTone }]}>{transaction.analysis.status}</Text>
              </View>
              {!!transaction.analysis.message && <Text style={styles.metaText}>{transaction.analysis.message}</Text>}
              {!!transaction.analysis.score && <Text style={styles.metaText}>Puntaje: {transaction.analysis.score}</Text>}
            </View>
          </ScreenReveal>
        )}

        <ScreenReveal delay={200}>
          <View style={styles.card}>
            <LinearGradient
              colors={tokens.stripeColors}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardStripes}
            />
            <Text style={styles.sectionTitle}>Riesgo IA</Text>
            <View style={[styles.pill, { backgroundColor: `${riskTone}1A`, borderColor: `${riskTone}33` }]}>
              <Text style={[styles.pillText, { color: riskTone }]}>{riskLabelText(transaction.riskLabel)}</Text>
            </View>
            <Text style={styles.metaText}>Score: {formatScore(transaction.riskScore)}</Text>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={240}>
          <View style={styles.actionsRow}>
            <PressableScale
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('StationDetail', { stationId: transaction.stationId })}
            >
              <Text style={styles.actionText}>Ver estación</Text>
            </PressableScale>
            <PressableScale
              style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: transaction.vehicleId })}
            >
              <Text style={styles.actionText}>Ver vehículo</Text>
            </PressableScale>
          </View>
        </ScreenReveal>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, tokens: PremiumTokens) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: tokens.cardSurface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.cardBorder,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.cardSurface,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  body: { padding: 20, paddingBottom: 30 },
  card: {
    backgroundColor: tokens.cardSurface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
    shadowColor: '#000',
    shadowOpacity: tokens.shadowOpacity,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  cardStripes: {
    ...StyleSheet.absoluteFillObject,
    opacity: tokens.isDark ? 0.6 : 0.35,
  },
  sectionTitle: { fontWeight: '700', fontSize: 15, marginBottom: 10, color: colors.text },
  metaText: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 8,
  },
  pillText: { fontSize: 11, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 6, marginBottom: 20 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  actionText: { color: colors.white, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginTop: 12, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
