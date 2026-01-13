import * as React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// LinearGradient's TS types can occasionally cause JSX typing errors in some configs.
// Use a typed alias to ensure it can be used as a JSX component.
const Gradient = LinearGradient as unknown as React.ComponentType<any>;
import { COLORS } from '../theme/colors';


type Props = { label?: string };

export default function LoadingScreen({ label }: Props) {
  const [activeDot, setActiveDot] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setActiveDot((d) => (d + 1) % 3), 400);
    return () => clearInterval(id);
  }, []);

  return (
    <Gradient
      colors={[COLORS.warning, COLORS.primary, COLORS.error]}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.container}
    >
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <FontAwesome5 name="gas-pump" size={78} color={COLORS.white} solid />
        </View>
        <Text style={styles.title}>EcoCombustible Regulador</Text>
        <Text style={styles.subtitle}>Sistema de Supervisión de Combustibles</Text>

        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeDot ? styles.dotActive : undefined,
              ]}
            />
          ))}
        </View>

      </View>

      <Text style={styles.footer}>Gobierno del Ecuador{"\n"}ARCERNNR</Text>
    </Gradient>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  iconWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  icon: { width: 80, height: 80, tintColor: COLORS.white },
  title: { color: COLORS.white, fontSize: 20, fontWeight: '600', marginTop: 6 },
  subtitle: { color: COLORS.white, opacity: 0.95, marginTop: 8, textAlign: 'center', fontSize: 15 },
  dots: { flexDirection: 'row', marginTop: 22 },
  dot: { width: 10, height: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.9)', marginHorizontal: 8 },
  dotActive: { width: 14, height: 14, borderRadius: 8, backgroundColor: COLORS.white },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.95)', padding: 18, fontSize: 13 },
});
