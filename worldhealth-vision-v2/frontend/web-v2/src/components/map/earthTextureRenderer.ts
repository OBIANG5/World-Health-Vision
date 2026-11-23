/**
 * Real Earth imagery, orthographic WebGL projection, no dependency or tile API.
 *
 * The texture is served from /earth-atmos-2048.jpg in the same build, rather
 * than requesting third-party domains per visitor. Projection deliberately
 * shares projectCoordinates/inverseProjection's pose with GlobeMap's existing
 * GeoJSON borders, country hit-tests and keyboard/pointer controls.
 *
 * WebGL is an OPTIONAL rendering path, not an app requirement. The original
 * GeoJSON vector cartography is retained when WebGL is absent, fails, or
 * graphics acceleration is disabled. No terrain, live climate or real-time
 * weather is inferred from these historical satellite composites.
 */
export type EarthTextureRenderer = {
  readonly canvas: HTMLCanvasElement;
  render: (centerLon: number, centerLat: number, resolution: number) => void;
  destroy: () => void;
};
const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vSphere;
void main() {
  vSphere = position;
  gl_Position = vec4(position, 0.0, 1.0);
}`;
const FRAGMENT_SHADER = `
precision highp float;
varying vec2 vSphere;
uniform sampler2D earthTexture;
uniform float centerLongitude;
uniform float centerLatitude;
const float PI = 3.141592653589793;
void main() {
  float squared = dot(vSphere, vSphere);
  if (squared > 1.0) discard;
  float z = sqrt(max(0.0, 1.0 - squared));
  float sinB = sin(centerLatitude), cosB = cos(centerLatitude);
  float longitude = centerLongitude +
    atan(vSphere.x, z * cosB - vSphere.y * sinB);
  float latitude = asin(clamp(z * sinB + vSphere.y * cosB, -1.0, 1.0));
  // JPEG equirectangular atlas: west at 0, east at 1.
  // UNPACK_FLIP_Y_WEBGL makes image north correspond to GL v=1.
  vec2 uv = vec2(fract(longitude / (2.0 * PI) + 0.5),
                 latitude / PI + 0.5);
  vec3 earth = texture2D(earthTexture, uv).rgb;
  // Physically inspired artistic day-side lighting. NOT a live satellite view.
  float diffuse = clamp(dot(normalize(vec3(-0.42, 0.43, 0.85)),
                            vec3(vSphere.x,vSphere.y,z)), 0.0, 1.0);
  float light = 0.76 + 0.24 * diffuse;
  float atmosphere = pow(1.0 - z, 5.0);
  // A small lift from the overly dark first proof, without painting
  // synthetic forest/desert colors or converting color into false data.
  vec3 color = pow(earth, vec3(0.82)) * vec3(1.09,1.09,1.12) * light;
  color += vec3(0.02,0.21,0.31) * atmosphere;
  gl_FragColor = vec4(min(color, vec3(1.0)), 1.0);
}`;
const DEG_TO_RAD = Math.PI / 180;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw Error("WebGL shader unavailable");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error";
    gl.deleteShader(shader);
    throw Error(info);
  }
  return shader;
}

export function createEarthTextureRenderer(image: HTMLImageElement): EarthTextureRenderer {
  if (!image.complete || image.naturalWidth < 1024 || image.naturalHeight < 512) {
    throw Error("Earth image must be decoded before GPU use");
  }
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", {
    alpha: true, premultipliedAlpha: false, antialias: false,
    preserveDrawingBuffer: true, powerPreference: "low-power",
  });
  if (!gl) throw Error("WebGL unavailable: use GeoJSON fallback");
  let vertex: WebGLShader | null = null;
  let fragment: WebGLShader | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  try {
    vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    program = gl.createProgram();
    if (!program) throw Error("WebGL program unavailable");
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw Error(gl.getProgramInfoLog(program) ?? "Unable to link Earth shader");
    }
    buffer = gl.createBuffer();
    texture = gl.createTexture();
    if (!buffer || !texture) throw Error("WebGL buffer/texture unavailable");
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1,
    ]), gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, "position");
    if (location < 0) throw Error("Earth shader has no position attribute");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program,"earthTexture"),0);
  } catch (error) {
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    throw error;
  }
  const readyProgram = program;
  const readyTexture = texture;
  const readyBuffer = buffer;
  const latitudeUniform = gl.getUniformLocation(program, "centerLatitude");
  const longitudeUniform = gl.getUniformLocation(program, "centerLongitude");
  let destroyed = false;
  let lastWidth = 0, lastLon = NaN, lastLat = NaN;
  return {
    canvas,
    render(centerLon, centerLat, resolution) {
      if (destroyed || gl.isContextLost()) return;
      const nextWidth = Math.min(1024, Math.max(128, Math.ceil(resolution / 8) * 8));
      if (canvas.width !== nextWidth) {
        canvas.width = canvas.height = nextWidth;
        gl.viewport(0,0,nextWidth,nextWidth);
      }
      if (lastWidth === nextWidth && lastLon === centerLon && lastLat === centerLat) return;
      lastWidth = nextWidth; lastLon = centerLon; lastLat = centerLat;
      gl.useProgram(readyProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER,readyBuffer);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,readyTexture);
      gl.uniform1f(longitudeUniform,centerLon*DEG_TO_RAD);
      gl.uniform1f(latitudeUniform,centerLat*DEG_TO_RAD);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES,0,6);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      gl.deleteTexture(readyTexture);
      gl.deleteBuffer(readyBuffer);
      gl.deleteProgram(readyProgram);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    },
  };
}
