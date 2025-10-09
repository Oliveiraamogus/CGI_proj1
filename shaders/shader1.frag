#version 300 es

precision mediump float;

in float v_hue;
uniform float u_now;
uniform float u_speed;
out vec4 frag_color;

float hue2rgb(float hue, float sat, float lum) {
  if(lum < 0.0f)
    lum += 1.0f;
  if(lum > 1.0f)
    lum -= 1.0f;
  if(lum < 1.0f / 6.0f)
    return hue + (sat - hue) * 6.0f * lum;
  if(lum < 1.0f / 2.0f)
    return sat;
  if(lum < 2.0f / 3.0f)
    return hue + (sat - hue) * (2.0f / 3.0f - lum) * 6.0f;
  return hue;
}

vec3 hsl2rgb(vec3 c) {
  float hue = c.x;
  float sat = c.y;
  float lum = c.z;

  float r, g, b;

  if(sat == 0.0f) {
    r = g = b = lum;
  } else {
    float q = lum < 0.5f ? lum * (1.0f + sat) : lum + sat - lum * sat;
    float p = 2.0f * lum - q;
    r = hue2rgb(p, q, hue + 1.0f / 3.0f);
    g = hue2rgb(p, q, hue);
    b = hue2rgb(p, q, hue - 1.0f / 3.0f);
  }

  return vec3(r, g, b);
}

void main() {
  float hue = fract(v_hue + u_now * u_speed);
  vec3 rgb = hsl2rgb(vec3(hue, 1.0f, 0.5f));

  frag_color = vec4(rgb, 1.0f);

}