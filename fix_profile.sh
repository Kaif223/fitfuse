#!/bin/bash
head -262 '/home/kaif/Downloads/fitfuse-complete/fitfuse/app/(tabs)/profile.tsx' > /tmp/profile_clean.tsx
cp /tmp/profile_clean.tsx '/home/kaif/Downloads/fitfuse-complete/fitfuse/app/(tabs)/profile.tsx'
echo "Done. Lines: $(wc -l < '/home/kaif/Downloads/fitfuse-complete/fitfuse/app/(tabs)/profile.tsx')"
