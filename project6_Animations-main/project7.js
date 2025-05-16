// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	// Rotation around X axis
	var cosX = Math.cos(rotationX);
	var sinX = Math.sin(rotationX);
	var rotX = [
		1,    0,     0, 0,
		0, cosX, sinX, 0,
		0, -sinX, cosX, 0,
		0,    0,     0, 1
	];

	// Rotation around Y axis
	var cosY = Math.cos(rotationY);
	var sinY = Math.sin(rotationY);
	var rotY = [
		cosY, 0, -sinY, 0,
		   0, 1,     0, 0,
		sinY, 0,  cosY, 0,
		   0, 0,     0, 1
	];

	// Translation matrix
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	// Combined transformations    
	var modelView = MatrixMult(trans, rotX);        
	modelView = MatrixMult(modelView, rotY); 
	return modelView;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		// Lines taken from project4.js (and modified)
		// Vertex shader source code
		var boxVS = `
            attribute vec3 pos;
            attribute vec2 texCoord; // Add texture coordinate attribute
			attribute vec3 normal; // Add normal attribute

            uniform mat4 mvp;
			uniform mat4 uMV; // Model-view matrix
			uniform mat3 mNormal; // Normal transformation matrix

            varying vec2 vTexCoord; // Pass the texture coordinates to the fragment shader
			varying vec3 vNormal;
			varying vec3 vPos;

            void main()
            {
				vec4 posCam = uMV * vec4(pos, 1.0);
				gl_Position = mvp * vec4(pos, 1.0);
				vTexCoord = texCoord;
				vNormal = mNormal * normal;
				vPos = posCam.xyz;
            }
        `;

        // Fragment shader source
        var boxFS = `
			precision mediump float;

			varying vec2 vTexCoord; // Receive texture coordinates
			varying vec3 vNormal;
			varying vec3 vPos;

			uniform sampler2D textureSampler; // Declare a sampler2D uniform for the texture
			uniform bool useTexture; // Uniform to control texture usage

			uniform vec3 uLightDir;
			uniform float shininess;
    
            void main()
            {
				vec3 N = normalize(vNormal);
				vec3 L = normalize(uLightDir);
				vec3 V = normalize(-vPos);
				vec3 H = normalize(L + V);
				float diffuse = max(dot(N, L), 0.0);
				float specular = pow(max(dot(N, H), 0.0), shininess); // Use Blinn material model for shading
				specular *= (shininess + 8.0) / 8.0; 
				vec3 color = useTexture ? texture2D(textureSampler, vTexCoord).rgb : vec3(1.0); // Kd and Ks coefficients are white
				vec3 finalColor = color * diffuse + vec3(1.0) * specular;
				gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
		// Compile the shader program
		this.prog = InitShaderProgram(boxVS, boxFS);
		// Get the ids of the uniform variables in the shaders
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
		// Get the ids of the vertex attributes in the shaders
		this.vertPos = gl.getAttribLocation(this.prog, 'pos');
		// Create the buffer objects
		this.vertbuffer = gl.createBuffer();
		// Get the
		this.uMV = gl.getUniformLocation(this.prog, 'uMV');
		// Get the
		this.mNormal = gl.getUniformLocation(this.prog, 'mNormal');

		// Parameters for initializing the texture
		this.useTexture = gl.getUniformLocation(this.prog, 'useTexture');
		this.useTextureLocal = false;
		this.texCoord = gl.getAttribLocation(this.prog, 'texCoord');
		this.texCoordBuffer = gl.createBuffer();
		this.texture = gl.createTexture();
		this.textureSampler = gl.getUniformLocation(this.prog, 'textureSampler');
		
		// Normals (set the variable)
		this.normals = gl.getAttribLocation(this.prog, 'normal');
		this.normalsBuffer = gl.createBuffer();

		// Set light
		this.uLightDir = gl.getUniformLocation(this.prog, 'uLightDir');
		this.uShininess = gl.getUniformLocation(this.prog, 'shininess');
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		// Lines taken from project4.js (and modified)
		gl.useProgram(this.program);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// Copy the original vertex positions for later use (swaping)
		this.originalVertPos = vertPos.slice(); 

		// Update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		// Update nromal coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		// Lines taken from project4.js 
		const swapped = this.originalVertPos.slice(); // Make a copy

		for (let i = 0; i < swapped.length; i += 3) {
			if (swap) {
				const temp = swapped[i + 1];       
				swapped[i + 1] = swapped[i + 2];   
				swapped[i + 2] = temp;             
			}
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(swapped), gl.STATIC_DRAW);

		DrawScene(); // Trigger re-render
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		// Lines taken from project4.js (and modified)
		gl.useProgram(this.prog);

		// Pass MVP, MV, and Normal matrices to the shader
		gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
		gl.uniformMatrix4fv(this.uMV, false, matrixMV);
		gl.uniformMatrix3fv(this.mNormal, false, matrixNormal);

		// Vertex position
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.vertPos);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texCoord);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
		gl.vertexAttribPointer(this.normals, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normals);


        // Bind the texture coordinate buffer
		gl.uniform1i(this.useTexture, this.useTextureLocal); 
		if (this.useTextureLocal) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.uniform1i(this.textureSampler, 0);
		}

		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		// Lines taken from project4.js 
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		// Set texture parameters 
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);

        // Set the texture uniform to 0 
        gl.useProgram(this.prog);
        gl.uniform1i(this.textureSampler, 0);
		this.useTextureLocal = true; 
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		this.useTextureLocal = show;
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		let length = Math.hypot(x, y, z);
		if (length > 0) {
			x /= length;
			y /= length;
			z /= length;
		}

		// Send light direction to the shader
		gl.useProgram(this.prog); 
		gl.uniform3f(this.uLightDir, x, y, z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
		gl.uniform1f(this.uShininess, shininess);
	}
}

// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	var forces = Array( positions.length ); // The total for per particle

	// [TO-DO] Compute the total force of each particle
	for (let i = 0; i < positions.length; i++) {
		forces[i] = gravity.mul(particleMass); 
	}

	// spring forces
	for (let i = 0; i < springs.length; i++) {
		const a = springs[i].p0;
		const b = springs[i].p1;
		const restLength = springs[i].rest;

		const posA = positions[a];
		const posB = positions[b];
		const velA = velocities[a];
		const velB = velocities[b];

		const deltaPos = posB.sub(posA);
		const distance = deltaPos.len();
		let dir = deltaPos
		dir.normalize();

		const springForceMag = stiffness * (distance - restLength);
		const relVel = velB.sub(velA);
		const dampingMag = damping * relVel.dot(dir);
		const force = dir.mul(springForceMag + dampingMag);

		forces[a].inc(force);
		forces[b].dec(force);
	}
		
	// [TO-DO] Update positions and velocities
	for (let i = 0; i < positions.length; i++) {
		const acc = forces[i].div(particleMass); // F = ma -> a = F/m
		positions[i].inc(velocities[i].mul(dt)); // p += v * dt
		velocities[i].inc(acc.mul(dt)); // v += a * dt
	}

	// [TO-DO] Handle collisions
	for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const vel = velocities[i];

        for (let axis of ['x', 'y', 'z']) {
            if (pos[axis] <= -1) {
				let h = pos[axis] + 1; // -(-1)
                pos[axis] = -1 + restitution * h; // how much do we have to go above the line
				vel[axis] = -restitution * vel[axis];
            } else if (pos[axis] >= 1) {
                let h = pos[axis] - 1; 
                pos[axis] = 1 + restitution * h; // how much do we have to go above the line
				vel[axis] = -restitution * vel[axis];
            }
        }
	}
}


