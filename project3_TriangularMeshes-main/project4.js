// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
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
	var modelView = MatrixMult(projectionMatrix, trans);        
	modelView = MatrixMult(modelView, rotX);        
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
		// Lines taken from project4.html (and modified)
		// Vertex shader source code
		var boxVS = `
            attribute vec3 pos;
            attribute vec2 texCoord; // Add texture coordinate attribute
            uniform mat4 mvp;
            varying vec2 vTexCoord; // Pass the texture coordinates to the fragment shader
            void main()
            {
                gl_Position = mvp * vec4(pos, 1);
                vTexCoord = texCoord; // Pass texture coordinates to fragment shader
            }
        `;

        // Fragment shader source
        var boxFS = `
            precision mediump float;
            varying vec2 vTexCoord; // Receive texture coordinates
            uniform sampler2D textureSampler; // Declare a sampler2D uniform for the texture
			uniform bool useTexture; // Uniform to control texture usage
            void main()
            {
				if (useTexture)
					gl_FragColor = texture2D(textureSampler, vTexCoord); // Use texture
				else 
				 	gl_FragColor = vec4(1.0, 0.5, 0, 1.0); // Use orange color if texture is not used
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

		// Parameters for initializing the texture
		this.useTexture = gl.getUniformLocation(this.prog, 'useTexture');
		this.useTextureLocal = false;
		this.texCoord = gl.getAttribLocation(this.prog, 'texCoord');
		this.texCoordBuffer = gl.createBuffer();
		this.texture = gl.createTexture();
		this.textureSampler = gl.getUniformLocation(this.prog, 'textureSampler');
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		// Lines taken from project4.html (and modified)
		gl.useProgram(this.program);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// Copy the original vertex positions for later use (swaping)
		this.originalVertPos = vertPos.slice(); 

		// Update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		const swapped = this.originalVertPos.slice(); // Start with a copy

		for (let i = 0; i < swapped.length; i += 3) {
			if (swap) {
				const temp = swapped[i + 1];       // Y
				swapped[i + 1] = swapped[i + 2];   // Y = Z
				swapped[i + 2] = temp;             // Z = Y
			}
	}

	// Re-upload swapped (or original) vertex buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(swapped), gl.STATIC_DRAW);

	DrawScene(); // Trigger re-render
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		// Draw the line segments (taken from project4.html)
		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvp, false, trans);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.vertPos);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texCoord);

        // Bind the texture coordinate buffer
		gl.uniform1i(this.useTexture, this.useTextureLocal); 
		if (this.useTextureLocal) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.uniform1i(this.textureSampler, 0);
		}

        // Draw the triangles
        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
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
	
}
