export const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fluidShader = `
  uniform float iTime;
  uniform vec2 iResolution;
  uniform vec4 iMouse;
  uniform int iFrame;
  uniform sampler2D iPreviousFrame;
  uniform float uBrushSize;
  uniform float uBrushStrength;
  uniform float uFluidDecay;
  uniform float uTrailLength;
  uniform float uStopDecay;

  varying vec2 vUv;

  vec2 ur, U;

  float ln(vec2 p, vec2 a, vec2 b) {
    return length(p - a - (b - a) * clamp(dot(p - a, b - a) / dot(b - a, b - a), 0.0, 1.0));
  }

  vec4 t(vec2 v, int a, int b) {
    return texture2D(iPreviousFrame, fract((v + vec2(float(a), float(b))) / ur));
  }

  vec4 t(vec2 v) {
    return texture2D(iPreviousFrame, fract(v / ur));
  }

  float area(vec2 a, vec2 b, vec2 c) {
    float A = length(b - c);
    float B = length(c - a);
    float C = length(a - b);
    float s = 0.5 * (A + B + C);

    return sqrt(s * (s - A) * (s - B) * (s - C));
  }

  void main() {
    U = vUv * iResolution;
    ur = iResolution.xy;

    if (iFrame < 1) {
      float w = 0.5 + sin(0.2 * U.x) * 0.5;
      float q = length(U - 0.5 * ur);

      gl_FragColor = vec4(0.1 * exp(-0.001 * q * q), 0.0, 0.0, w);
    } else {
      vec2 v = U;
      vec2 A = v + vec2(1.0, 1.0);
      vec2 B = v + vec2(1.0, -1.0);
      vec2 C = v + vec2(-1.0, 1.0);
      vec2 D = v + vec2(-1.0, -1.0);

      for (int i = 0; i < 8; i++) {
        v -= t(v).xy;
        A -= t(A).xy;
        B -= t(B).xy;
        C -= t(C).xy;
        D -= t(D).xy;
      }

      vec4 me = t(v);

      vec4 n = t(v, 0, 1);
      vec4 e = t(v, 1, 0);
      vec4 s = t(v, 0, -1);
      vec4 w = t(v, -1, 0);

      vec4 ne = 0.25 * (n + e + s + w);

      me = mix(t(v), ne, vec4(0.15, 0.15, 0.95, 0.0));
      me.z = me.z - 0.01 * ((area(A, B, C) + area(B, C, D)) - 4.0);

      vec4 pr = vec4(e.z, w.z, n.z, s.z);

      me.xy = me.xy + 100.0 * vec2(pr.x - pr.y, pr.z - pr.w) / ur;

      me.xy *= uFluidDecay;
      me.z *= uTrailLength;

      if (iMouse.z > 0.0) {
        vec2 mousePos = iMouse.xy;
        vec2 mousePrev = iMouse.zw;
        vec2 mouseVel = mousePos - mousePrev;

        float velMagnitude = length(mouseVel);
        float q = ln(U, mousePos, mousePrev);

        vec2 m = mousePos - mousePrev;
        float l = length(m);

        if (l > 0.0) {
          m = min(l, 10.0) * m / l;
        }

        float brushSizeFactor = 1e-4 / uBrushSize;
        float strengthFactor = 0.03 * uBrushStrength;

        float falloff = exp(-brushSizeFactor * q * q * q);
        falloff = pow(falloff, 0.5);

        me.xyw += strengthFactor * falloff * vec3(m, 10.0);

        if (velMagnitude < 2.0) {
          float distToCursor = length(U - mousePos);
          float influence = exp(-distToCursor * 0.01);
          float cursorDecay = mix(1.0, uStopDecay, influence);

          me.xy *= cursorDecay;
          me.z *= cursorDecay;
        }
      }

      gl_FragColor = clamp(me, -0.4, 0.4);
    }
  }
`;

export const displayShader = `
  uniform float iTime;
  uniform vec2 iResolution;
  uniform sampler2D iFluid;

  uniform float uDistortionAmount;
  uniform vec2 uParallax;

  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;

  uniform vec3 uNextColor1;
  uniform vec3 uNextColor2;
  uniform vec3 uNextColor3;
  uniform vec3 uNextColor4;

  uniform float uRevealProgress;
  uniform vec2 uRevealCenter;
  uniform vec3 uRevealBorderColor;

  uniform float uColorIntensity;
  uniform float uSoftness;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  vec3 getGradientColor(
    vec2 uv,
    float d,
    float a,
    vec3 color1,
    vec3 color2,
    vec3 color3,
    vec3 color4
  ) {
    float mixer1 = cos(uv.x * d) * 0.5 + 0.5;
    float mixer2 = cos(uv.y * a) * 0.5 + 0.5;
    float mixer3 = sin(d + a) * 0.5 + 0.5;

    float smoothAmount = clamp(uSoftness * 0.1, 0.0, 0.9);

    mixer1 = mix(mixer1, 0.5, smoothAmount);
    mixer2 = mix(mixer2, 0.5, smoothAmount);
    mixer3 = mix(mixer3, 0.5, smoothAmount);

    vec3 col = mix(color1, color2, mixer1);
    col = mix(col, color3, mixer2);
    col = mix(col, color4, mixer3 * 0.4);

    return col;
  }

  void main() {
    vec2 fragCoord = vUv * iResolution;

    vec4 fluid = texture2D(iFluid, vUv);
    vec2 fluidVel = fluid.xy;

    float mr = min(iResolution.x, iResolution.y);
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / mr;
    uv += uParallax;

    uv += fluidVel * (0.5 * uDistortionAmount);

    float d = -iTime * 0.5;
    float a = 0.0;

    for (float i = 0.0; i < 8.0; ++i) {
      a += cos(i - d - a * uv.x);
      d += sin(uv.y * i + a);
    }

    d += iTime * 0.5;

    vec3 currentCol = getGradientColor(
      uv,
      d,
      a,
      uColor1,
      uColor2,
      uColor3,
      uColor4
    );

    vec3 nextCol = getGradientColor(
      uv,
      d,
      a,
      uNextColor1,
      uNextColor2,
      uNextColor3,
      uNextColor4
    );

    float aspect = iResolution.x / iResolution.y;

    vec2 revealUv = (vUv - 0.5) * vec2(aspect, 1.0) + 0.5;
    vec2 revealCenter = (uRevealCenter / iResolution - 0.5) * vec2(aspect, 1.0) + 0.5;

    float maxDistance = length(vec2(aspect, 1.0));
    float distToCenter = distance(revealUv, revealCenter);

    float n1 = noise(revealUv * 14.0 + iTime * 0.12);
    float n2 = noise(revealUv * 36.0 - iTime * 0.08);
    float noisyDistance = distToCenter + n1 * 0.08 + n2 * 0.035;

    float radius = uRevealProgress * maxDistance * 1.15;
    float edgeWidth = 0.075;

    float revealMask = 1.0 - smoothstep(
      radius - edgeWidth,
      radius + edgeWidth,
      noisyDistance
    );

    float revealEdge =
      smoothstep(radius - edgeWidth * 1.5, radius, noisyDistance) *
      (1.0 - smoothstep(radius, radius + edgeWidth * 1.5, noisyDistance));

    revealEdge *= smoothstep(0.01, 0.08, uRevealProgress);
    revealEdge *= 1.0 - smoothstep(0.88, 1.0, uRevealProgress);

    vec3 col = mix(currentCol, nextCol, revealMask);

    col += uRevealBorderColor * revealEdge * 0.75;

    col *= uColorIntensity;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const transitionShader = `
  uniform float uTransition;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec3 uBorderColor;

  varying vec2 vUv;

  vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
  }

  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  vec3 fade(vec3 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  float cnoise(vec3 P) {
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);

    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);

    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);

    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);

    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));

    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);

    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));

    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);

    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

    vec4 norm0 = taylorInvSqrt(
      vec4(
        dot(g000, g000),
        dot(g100, g100),
        dot(g010, g010),
        dot(g110, g110)
      )
    );

    g000 *= norm0.x;
    g100 *= norm0.y;
    g010 *= norm0.z;
    g110 *= norm0.w;

    vec4 norm1 = taylorInvSqrt(
      vec4(
        dot(g001, g001),
        dot(g101, g101),
        dot(g011, g011),
        dot(g111, g111)
      )
    );

    g001 *= norm1.x;
    g101 *= norm1.y;
    g011 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));

    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);

    float n_z = mix(
      mix(n000, n100, fade_xyz.x),
      mix(n010, n110, fade_xyz.x),
      fade_xyz.y
    );

    float n_dz = mix(
      mix(n001, n101, fade_xyz.x),
      mix(n011, n111, fade_xyz.x),
      fade_xyz.y
    );

    return 2.2 * mix(n_z, n_dz, fade_xyz.z);
  }

  void main() {
    float pixelSize = 10.0;

    vec2 grid = uResolution / pixelSize;
    vec2 pixelatedUv = floor(vUv * grid) / grid;

    float aspect = uResolution.x / uResolution.y;
    vec2 correctedUv = (pixelatedUv - 0.5) * vec2(aspect, 1.0) + 0.5;

    float maxDistance = length(vec2(aspect, 1.0)) * 0.5;

    vec2 displacedUv =
      correctedUv + cnoise(vec3(correctedUv * 5.0, uTime * 0.1));

    float strength = cnoise(vec3(displacedUv * 5.0, uTime * 0.2));

    float d = length(correctedUv - 0.5);
    float normalizedDistance = d / maxDistance;

    float radialGradient =
      normalizedDistance * 12.5 +
      (1.0 - uTransition) * 2.0 -
      15.0 * uTransition;

    float rawStrength = strength + radialGradient;

    strength = clamp(rawStrength, 0.0, 1.0);

    float edge =
      smoothstep(0.0, 0.7, rawStrength) *
      smoothstep(2.5, 0.7, rawStrength);

    edge *= min((1.0 - abs(uTransition - 0.5) * 2.0) * 4.0, 1.0);

    vec3 deepColor = uBorderColor * 0.015;
    vec3 glowColor = uBorderColor * 1.5;

    vec3 edgeColor = mix(
      deepColor,
      glowColor,
      sin(uTime * 1.5) * 0.5 + 0.5
    );

    vec3 baseColor = vec3(1.0);
    vec3 planeColor = mix(baseColor, edgeColor * 1.8 + baseColor, edge);

    float finalAlpha = max(strength, edge);

    gl_FragColor = vec4(planeColor, finalAlpha);
  }
`;