# Prompt für Gemini: Übungs-GIFs für „Aufbau“

So gehst du vor:
1. Öffne einen neuen Chat auf gemini.google.com und schick den **Grund-Prompt** (Abschnitt A) unverändert. Er legt Stil, Figur und Format für alle Übungen fest.
2. Schick als Test nur **Bizeps-Curl** aus Abschnitt B. Lade das GIF herunter und öffne es am PC: Bewegt es sich? Bleibt der Ellbogen am Körper? Wenn ja, weiter mit Schritt 3.
3. Schick die übrigen Übungen, **eine pro Nachricht**, alle im selben Chat.
4. Speicher jedes GIF im Ordner `uebungen` im Projektordner `Eigene App`, benannt wie die **Datei-ID** in Klammern, z. B. `bizeps-curl.gif`.
5. Sag mir Bescheid, auch wenn erst ein paar fertig sind. Ich binde sie dann ein.

Kommt nur ein Standbild statt einer Animation, schick: `Please create two still images in exactly this style instead: the start position and the end position.` Speicher sie als `bizeps-curl-start.png` und `bizeps-curl-ende.png`. Daraus baue ich in der App eine weiche Überblendung.

Hinweise:
- Stimmt etwas nicht (falsche Hand, Bewegung zu schnell, Figur sieht anders aus), antworte einfach mit der Korrektur, z. B. „Same GIF, but the elbow must stay at the side of the body“.
- Die Prompts sind auf Englisch, weil Bild-KIs damit zuverlässiger arbeiten.

---

## A. Grund-Prompt (einmal am Anfang schicken)

```
I need a consistent series of 34 short animated exercise GIFs for a fitness app. Every GIF must follow these rules exactly, so the whole series looks like one set:

STYLE
- Clean, modern 3D illustration of a neutral, slim athletic mannequin figure: smooth matte light-grey body, no face details, no hair, no clothing logos, no text.
- The target muscle of the exercise glows in lime green (#C6F432). Everything else stays grey.
- Background: plain, flat, very dark grey (#1A1C1F), no room, no shadows except a soft contact shadow on the floor, a thin slightly lighter floor line.
- Equipment, only when the exercise needs it: one adjustable dumbbell (dark grey with light grey plates), a simple four-legged chair (light grey), a towel. Nothing else in the scene.

CAMERA
- Fixed camera, no camera movement, no zoom, no cuts.
- The whole body and the equipment are always fully visible with some margin.
- Use the camera angle I name for each exercise (side view, front view, back view or top view).

MOVEMENT
- Controlled, realistic, correct technique, like a professional trainer demonstrates it.
- Tempo: about 1 second for the lifting part, about 2 seconds for the lowering part, short pause at both ends.
- Show exactly 1 repetition. The last frame must match the first frame so the GIF loops seamlessly.
- One-arm or one-leg exercises: the right side works, the camera sees the working side.

FORMAT
- Animated GIF, square, about 480 x 480 pixels, looping endlessly.
- About 12 to 16 frames for one repetition, so the movement looks smooth.
- No text, no watermark, no border.

Confirm that you understood. I will then send you one exercise per message.
```

---

## B. Übungen (je eine Nachricht)

### Brust, Schultern, Trizeps

**Liegestütze, Hände auf dem Stuhl** (`liegestuetze-stuhl`)
```
Exercise: incline push-up with hands on the front edge of the chair seat. Side view. Body forms a straight line from head to heels, hands slightly wider than shoulders, lower the chest to just above the seat edge, elbows about 45 degrees from the body, push back up. Glowing muscle: chest.
```

**Liegestütze, Boden** (`liegestuetze`)
```
Exercise: standard push-up on the floor. Side view. Body straight like a board, lower the chest to just above the floor, elbows about 45 degrees from the body, push back up. Glowing muscle: chest.
```

**Liegestütze, Füße auf dem Stuhl** (`liegestuetze-fuesse-stuhl`)
```
Exercise: decline push-up with the feet on the chair seat and hands on the floor. Side view. Body straight, lower the chest towards the floor, push back up. Glowing muscle: chest, upper part.
```

**Einarmiges Bodendrücken** (`bodendruecken`)
```
Exercise: one-arm dumbbell floor press. Side view. Lying on the back on the floor, knees bent, feet flat. Start with the dumbbell held straight above the chest in the right hand, lower the upper arm until the elbow lightly touches the floor, pause briefly, press back up. Glowing muscle: chest.
```

**Einarmiges Schulterdrücken, sitzend** (`schulterdruecken`)
```
Exercise: seated one-arm dumbbell shoulder press. Side view. Sitting upright on the chair, feet flat on the floor. Dumbbell at shoulder height, palm facing forward, press straight up without locking the elbow, lower back to shoulder height. Free hand rests on the thigh. Glowing muscle: shoulder.
```

**Seitheben** (`seitheben`)
```
Exercise: one-arm dumbbell lateral raise. Front view. Standing, slightly leaning forward, free hand on the hip. Raise the right arm with a slightly bent elbow out to the side up to shoulder height, little finger slightly up, lower slowly. Glowing muscle: side of the shoulder.
```

**Seitheben, am Stuhl gelehnt** (`seitheben-gelehnt`)
```
Exercise: leaning one-arm lateral raise. Front view. Standing next to the chair, the left hand holds the top of the chair backrest, body leans slightly away from the chair. The right arm hangs straight down with the dumbbell, raise it out to the side up to shoulder height, lower slowly. Glowing muscle: side of the shoulder.
```

**Arnold-Press, einarmig** (`arnold-press`)
```
Exercise: seated one-arm Arnold press. Front view. Sitting on the chair. Start with the dumbbell in front of the right shoulder, palm facing the body. While pressing up, rotate the hand outward so the palm faces forward at the top. Rotate back while lowering. Glowing muscle: shoulder.
```

**Pike-Liegestütze** (`pike-liegestuetze`)
```
Exercise: pike push-up. Side view. Hips high, body forms an upside-down V, hands and feet on the floor. Bend the elbows and lower the head towards the floor between the hands, push back up. Glowing muscle: shoulders.
```

**Trizepsstrecken über Kopf** (`trizeps-ueberkopf`)
```
Exercise: seated two-hand overhead triceps extension. Side view. Sitting upright on the chair, holding one dumbbell with both hands at the upper end, arms straight overhead. Lower the dumbbell behind the head, elbows point forward and stay next to the head, only the forearms move, extend back up. Glowing muscle: back of the upper arms (triceps).
```

**Trizeps-Kickback** (`kickback`)
```
Exercise: one-arm triceps kickback. Side view. Bent forward with a flat back, left hand on the chair seat, feet staggered. Right upper arm parallel to the upper body and close to it. Extend the forearm backward until the arm is straight, hold briefly, return. Glowing muscle: triceps.
```

**Enge Liegestütze** (`enge-liegestuetze`)
```
Exercise: close-grip push-up on the floor. Side view. Hands shoulder-width or a bit narrower, elbows stay close to the body and point backward, body straight, lower the chest to just above the floor, push up. Glowing muscle: triceps.
```

**Einarmiger Skull Crusher am Boden** (`skull-crusher`)
```
Exercise: one-arm lying dumbbell skull crusher. Side view. Lying on the back on the floor, knees bent. Right upper arm points straight up and stays still, bend the forearm so the dumbbell moves toward the head, extend back up. Glowing muscle: triceps.
```

**Einarmige Flys am Boden** (`flys-boden`)
```
Exercise: one-arm dumbbell fly on the floor. Top view (camera looks straight down at the person lying on the back). Start with the dumbbell above the chest, arm slightly bent. Lower the arm in a wide arc out to the side until the upper arm touches the floor, return in the same arc. Glowing muscle: chest.
```

**Einarmiges Bodendrücken mit Pause** (`bodendruecken-pause`)
```
Exercise: one-arm dumbbell floor press with a pause. Side view. Same as a floor press, but the upper arm rests on the floor for 2 seconds at the bottom before pressing up. Glowing muscle: chest.
```

### Rücken, Bizeps

**Einarmiges Rudern** (`rudern`)
```
Exercise: one-arm dumbbell row supported on a chair. Side view. Left hand on the chair seat, feet staggered, flat back. The dumbbell hangs under the right shoulder, pull the elbow close to the body toward the hip, squeeze the shoulder blade back, lower slowly. Glowing muscle: upper back and lats.
```

**Rudern mit Pause oben** (`rudern-pause`)
```
Exercise: one-arm dumbbell row with a 2-second hold at the top. Side view. Same setup as a supported row, hold the top position for 2 seconds, lower in 3 seconds. Glowing muscle: upper back and lats.
```

**Pullover am Boden** (`pullover`)
```
Exercise: dumbbell pullover on the floor. Side view. Lying on the back, knees bent, holding one dumbbell with both hands above the chest. Lower the dumbbell in an arc behind the head with slightly bent arms until it almost touches the floor, pull back over the chest. Glowing muscle: lats.
```

**Reverse Flys, vorgebeugt** (`reverse-flys`)
```
Exercise: bent-over one-arm reverse fly. Back view. Bent forward with a flat back, free hand on the knee. Raise the right arm with a slightly bent elbow out to the side, squeeze the shoulder blade in, lower slowly. Glowing muscle: rear shoulder and upper back.
```

**Y-Heben in Bauchlage** (`y-heben`)
```
Exercise: prone Y-raise. Side view. Lying face down on the floor, arms stretched forward in a Y shape, thumbs up. Lift the arms and chest slightly off the floor, pull the shoulder blades down, hold briefly, lower. Glowing muscle: upper back.
```

**Bizeps-Curl** (`bizeps-curl`)
```
Exercise: standing one-arm dumbbell biceps curl. Side view. Standing upright, elbow stays at the side of the body. Curl the dumbbell with the palm facing up to the shoulder, squeeze briefly, lower slowly and completely. Glowing muscle: biceps.
```

**Hammer-Curl** (`hammer-curl`)
```
Exercise: standing one-arm hammer curl. Side view. Thumb points up the whole time, elbow stays at the side, curl to shoulder height, lower slowly. Glowing muscle: biceps and forearm.
```

**Hammer-Curl über Kreuz** (`hammer-curl-kreuz`)
```
Exercise: cross-body hammer curl. Front view. Thumb up, curl the dumbbell across the front of the body toward the opposite shoulder, lower slowly. Glowing muscle: biceps and forearm.
```

**Konzentrations-Curl** (`konzentrations-curl`)
```
Exercise: seated concentration curl. Side view. Sitting on the chair, leaning forward, the right elbow rests on the inside of the right thigh. Curl the dumbbell slowly toward the shoulder, squeeze, lower completely. Glowing muscle: biceps.
```

**Zottman-Curl** (`zottman-curl`)
```
Exercise: standing one-arm Zottman curl. Side view. Curl up with the palm facing up, at the top rotate the hand so the palm faces down, lower slowly with the palm down. Glowing muscle: biceps and forearm.
```

### Beine, Bauch

**Goblet-Kniebeuge** (`goblet-kniebeuge`)
```
Exercise: goblet squat. Side view. Holding one dumbbell vertically in front of the chest with both hands, feet shoulder-width. Push the hips back and down until the thighs are about parallel to the floor, chest up, heels stay down, stand back up. Glowing muscles: thighs and glutes.
```

**Sumo-Kniebeuge** (`sumo-kniebeuge`)
```
Exercise: dumbbell sumo squat. Front view. Wide stance, toes pointing out, one dumbbell hangs between the legs held with both hands. Lower the hips, knees push outward, stay upright, stand back up. Glowing muscles: thighs and glutes.
```

**Bulgarische Split-Kniebeuge** (`bulgarische`)
```
Exercise: Bulgarian split squat. Side view. The top of the rear foot rests on the chair seat behind, the front foot far enough forward that the knee stays over the foot, dumbbell in the right hand. Lower straight down until the front thigh is horizontal, push up through the front heel. Glowing muscles: front thigh and glutes.
```

**Ausfallschritte rückwärts** (`ausfallschritte-rueckwaerts`)
```
Exercise: reverse lunge with a dumbbell in the right hand. Side view. Stand upright, take a big step backward, lower the back knee to just above the floor, push through the front heel back to standing. Glowing muscles: thighs and glutes.
```

**Einbeiniges rumänisches Kreuzheben** (`rdl-einbeinig`)
```
Exercise: single-leg Romanian deadlift. Side view. Stand on the left leg with a slightly bent knee, dumbbell in the right hand. Hinge at the hips, the upper body and the free right leg form one straight line, lower until you feel a stretch in the back of the thigh, return upright. Glowing muscles: back of the thigh and glutes.
```

**Hip Thrust am Stuhl** (`hip-thrust-stuhl`)
```
Exercise: hip thrust with the upper back on the chair seat. Side view. Upper back rests on the edge of the chair seat, one dumbbell lies on the hips, feet flat, knees above the heels. Push the hips up until the upper body and thighs form a straight line, squeeze the glutes at the top, lower. Glowing muscle: glutes.
```

**Wadenheben, einbeinig** (`wadenheben`)
```
Exercise: single-leg calf raise. Side view. Standing on the right leg, the left foot lifted behind, right hand touches a plain wall for balance, dumbbell in the left hand. Rise as high as possible onto the toes, hold 1 second, lower slowly. Glowing muscle: calf.
```

**Unterarmstütz** (`unterarmstuetz`)
```
Exercise: forearm plank, held still. Side view. Elbows under the shoulders, body straight from head to heels, calm breathing visible. The figure holds the position for the whole video. Glowing muscle: abs.
```

**Seitstütz** (`seitstuetz`)
```
Exercise: side plank on the forearm, held still. Front view. Elbow under the shoulder, body forms a straight line, hips high, top hand on the hip. The figure holds the position for the whole video. Glowing muscle: side of the waist (obliques).
```

---

## C. Ruhetag-Programm (optional)

Gleicher Stil, aber ohne Hantel und mit ruhigem, fließendem Tempo:

- **Katze-Kuh** (`katze-kuh`): `Exercise: cat-cow on hands and knees, side view. Round the back while exhaling, then gently arch while inhaling. Slow and flowing. No glowing muscle.`
- **Drehung des oberen Rückens** (`brustwirbel-drehung`): `Exercise: thoracic rotation on hands and knees, side view. One hand behind the head, rotate the elbow up toward the ceiling, follow it with the eyes, return. No glowing muscle.`
- **Hüftbeuger-Dehnung im Halbknien** (`hueftbeuger`): `Exercise: half-kneeling hip flexor stretch, side view. Left knee on the floor, right foot in front, squeeze the glutes and shift the hips slightly forward, hold, release. No glowing muscle.`
- **Ausfallschritt mit Drehung** (`ausfallschritt-drehung`): `Exercise: lunge with rotation, side view. Big step forward, back knee toward the floor, rotate the upper body toward the front leg and open the arms, return. No glowing muscle.`
- **Schulterkreisen mit Handtuch** (`handtuch-schulter`): `Exercise: shoulder pass-through with a towel, side view. Hold a towel wide with both hands, move the straight arms slowly over the head to behind the body and back. No glowing muscle.`
- **Kindhaltung** (`kindhaltung`): `Exercise: child's pose, side view, held still. Sit back on the heels, upper body forward, arms long in front, forehead on the floor, calm breathing. No glowing muscle.`
