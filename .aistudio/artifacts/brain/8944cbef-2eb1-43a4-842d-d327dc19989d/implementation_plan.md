# Plan Naprawy: Likwidacja Migotania Światła i Fotorealistyczny Hangar PBR

Kompleksowy plan eliminacji irytującego błędu migającego światła nad statkiem oraz przekształcenia hangaru w fotorealistyczną przestrzeń 3D opartą na gładkich materiałach PBR, miękkich cieniach (*PCF Soft Shadows*), czystych detalach geometrycznych i kinowym, stabilnym oświetleniu studyjnym.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Kluczowe decyzje gracza z fazy pytań**:
> 1. **Światło nad statkiem**: Całkowite usunięcie stroboskopowego migotania i szumów natężenia. Ustawienie stabilnego, szlachetnego, kinowego oświetlenia (*steady cinematic key & rim lighting*).
> 2. **Kierunek wizualny**: Gładkie materiały PBR (metal, lakier ceramiczny, powłoka bez pikseli i bez zniekształceń moiré) z miękkimi cieniowymi kontaktowymi (*real-time soft shadows*), głębią i realistycznym odbiciem światła.

---

### 1. Diagnoza Źródła Błędów

1. **Błąd migającego światła nad statkiem**:
   - W `SpaceHangarScene.ts` światła silników i punktowe miały oscylacje `Math.sin(time * 22) * 0.8` (szybki stroboskop ~3.5 Hz) powodujący ciągłe błyskanie na kadłubie i w kokpicie.
   - W `CloneWarsHangar3D.ts` reflektory wiszącego spodka miały funkcję `shimmer = 16.0 + Math.sin(this.elapsedTime * 4.0) * 1.5`, a stożki świetlne i lampy obrysowe pulsowały z dużą częstotliwością, powodując wrażenie usterki renderowania.
   - Światło kokpitu `cockpitLight` wisiało statycznie w przestrzeni, podczas gdy statek unosił się w pionie, co wywoływało ostre przecięcia i migotanie na szkle canopii.

2. **Przyczyna wrażenia "pikselowatości" i braku realizmu**:
   - Rysowane proceduralnie siatki 2D w canvasie (cienkie linie 1-pikselowe) z dużą powtarzalnością `repeat.set(6, 6)` tworzyły zjawisko **aliasingu i prążków Moiré** pod kątem kamery, sprawiając wrażenie pikselowej tekstury.
   - Wyłączony silnik cieniowania (`renderer.shadowMap.enabled = false`) – brak cieni kontaktowych pod statkiem, podwoziem i filarami powodował, że obiekty wyglądały jak "zawieszone w próżni" i płaskie.
   - Brak anizotropowego filtrowania tekstur (`maxAnisotropy`).

---

### 2. Zakres Wdrożenia i Architektura

#### Krok 1: Usunięcie Migotania i Ustabilizowanie Oświetlenia Kinowego
- **Pliki**: `src/components/3d/SpaceHangarScene.ts`, `src/game/hangar/CloneWarsHangar3D.ts`
- **Zmiany**:
  - Usunięcie wszystkich szybkich funkcji `Math.sin` modulujących natężenie świateł (`spot.intensity`, `light.intensity`, `beaconPulse`).
  - Ustawienie stałego, stabilnego balansu oświetlenia:
    - Główny reflektor górny (*Key Light*): ciepłe, stałe światło 3200K oświetlające lądowisko i sylwetkę myśliwca.
    - Oświetlenie konturowe (*Aerospace Rim Light*): stały chłodny błękit rysujący ostre krawędzie skrzydeł.
    - Stała poświata antygrawitacyjna od spodu platformy (*Ventral Glow*) bez migotania.
  - Płynne, statyczne stożki wolumetryczne z `depthWrite: false` eliminujące z-fighting.

#### Krok 2: Gładkie Materiały PBR Bez Pikseli
- **Pliki**: `src/game/hangar/CloneWarsHangar3D.ts`
- **Zmiany**:
  - Zastąpienie pikselujących cienkich linii canvasowych eleganckimi, gładkimi materiałami **MeshStandardMaterial** oraz **MeshPhysicalMaterial** z fizycznymi właściwościami:
    - Stal pokładowa: `metalness: 0.85, roughness: 0.28` z delikatnym ziarnem mikroskopowym zamiast ostrych 1px linii.
    - Pas startowy: matowy grafit lotniczy z czystymi, wektorowymi oznaczeniami chevronowymi i gładką krawędzią.
    - Konstrukcja kopuły i żeber: czysty tytan i stop durastali z wyraźnymi fazowaniami (*chamfer/bevels*) w 3D, reagujący na odbicia środowiskowe (*RoomEnvironment*).
  - Włączenie maksymalnego filtrowania anizotropowego (`texture.anisotropy = renderer.capabilities.getMaxAnisotropy()`), co całkowicie likwiduje rozmycia i szumy pod ostrymi kątami.

#### Krok 3: Prawdziwe Miękkie Cienie (Real-Time Soft Shadows)
- **Pliki**: `src/components/3d/SpaceHangarScene.ts`, `src/game/hangar/CloneWarsHangar3D.ts`
- **Zmiany**:
  - Włączenie cieniowania w rendererze:
    `renderer.shadowMap.enabled = true;`
    `renderer.shadowMap.type = THREE.PCFSoftShadowMap;`
  - Włączenie rzucania cieni (`castShadow = true`) dla statku gracza, kanonierek LAAT, platformy i kolumn.
  - Włączenie odbierania cieni (`receiveShadow = true`) dla płyt podłogowych i pasa startowego.
  - Efekt: statek rzuca naturalny, miękki cień na podwyższoną platformę lądowiska, natychmiast nadając scenie głębię fotorealistycznego filmu.

#### Krok 4: Weryfikacja i Testy
- Sprawdzenie braku jakichkolwiek artefaktów migotania pod każdym kątem kamery (preset `Hangar Bay`, `Statek 3/4`, `Kokpit`).
- Weryfikacja kompilacji TypeScript i lintera (`compile_applet`, `lint_applet`).
