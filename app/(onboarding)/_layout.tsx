// apps/customer/app/(onboarding)/_layout.tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}> {/* No headers in onboarding */}
      <Stack.Screen name="splash" />
    </Stack>
  );
}