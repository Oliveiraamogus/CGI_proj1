#version 300 es

//precision mediump float;
in uint a_index;

void main() {
    //vec2 p = vec2(cos(a_index) * 0.5f, sin(a_index) * 0.5f);
    //gl_Position = vec4(cos((float) a_index ) * 0.5f, sin (float) a_index ) * 0.5f, 0.0f, 1.0f);

    gl_Position = vec4(cos(float(a_index)) * 0.5f, sin(float(a_index)) * 0.5f, 0.0f, 1.0f);
    gl_PointSize = 5.0f;
}