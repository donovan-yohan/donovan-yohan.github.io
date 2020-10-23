export default ` 
struct Position {
            float incline;
            float offsetVert;
            vec2 noiseFreq;
            float noiseFlow;
            float noiseAmp;
            float noiseSeed;
        };

        uniform Position u_position;
        uniform vec2 iResolution;

        void main() {
            // Left-to-right angle
            float incline = iResolution.x * uv.x * u_position.incline - 5.5;

            // Up-down shift to offset incline
            float offset = u_position.offsetVert;

            vec3 pos = vec3(
                position.x,
                position.y + incline - offset,
                position.z
            );

            gl_Position = vec4(pos, 1.0);
        }
        `