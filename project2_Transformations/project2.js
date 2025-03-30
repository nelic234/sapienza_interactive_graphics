// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	return Array( Math.cos(rotation) * scale, -Math.sin(rotation) * scale, 0, Math.sin(rotation) * scale, Math.cos(rotation) * scale, 0, positionX, positionY, 1)
}

// Multiplies two 3x3 matrices together and return them in a 1D array.
function multiply_matrix( matrix1, matrix2 )
{
	let result = Array( 0, 0, 0, 0, 0, 0, 0, 0, 0 );
	for (let i = 0; i < 3; i++) {
		for (let j = 0; j < 3; j++) {
			for (let k = 0; k < 3; k++) {
				result[i*3 + j] += matrix1[i*3 + k] * matrix2[k*3 + j];
			}
		}
	}
    return result;
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	return multiply_matrix(trans1, trans2);
}
