var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		// TO-DO: Check for shadows

		vec3 lightDir = normalize(lights[i].position - position);
		vec3 shadowRayOrigin = position + normal * 0.05; // bias to avoid self-shadowing
		Ray shadowRay;
		shadowRay.pos = shadowRayOrigin;
		shadowRay.dir = lightDir;
		HitInfo shadowHit;
		shadowHit.t = 1e20;
		bool inShadow = IntersectRay(shadowHit, shadowRay) && shadowHit.t < length(lights[i].position - position); // check if the hit is closer than the light source

		// TO-DO: If not shadowed, perform shading using the Blinn model
		if (!inShadow) {
			vec3 halfVec = normalize(lightDir + view);
			float NdotL = max(dot(normal, lightDir), 0.0);
			float NdotH = max(dot(normal, halfVec), 0.0); // Blin model

			vec3 diffuse  = mtl.k_d * NdotL;
			vec3 specular = mtl.k_s * pow(NdotH, mtl.n);

			color += (diffuse + specular) * lights[i].intensity;
		}
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;
	for ( int i=0; i<NUM_SPHERES; ++i ) {
		// TO-DO: Test for ray-sphere intersection
		// TO-DO: If intersection is found, update the given HitInfo
		Sphere sphere = spheres[i];
		vec3 oc = ray.pos - sphere.center;

		float a = dot(ray.dir, ray.dir);
		float b = 2.0 * dot(oc, ray.dir);
		float c = dot(oc, oc) - sphere.radius * sphere.radius;

		float discriminant = b * b - 4.0 * a * c;
		if (discriminant > 0.0) {
			float sqrtDisc = sqrt(discriminant);
			float t1 = (-b - sqrtDisc) / (2.0 * a);
			float t2 = (-b + sqrtDisc) / (2.0 * a);

			// Use the closest positive t
			float t = (t1 > 0.0) ? t1 : ((t2 > 0.0) ? t2 : -1.0);
			if (t > 0.0 && t < hit.t) {
				hit.t = t;
				hit.position = ray.pos + t * ray.dir;
				hit.normal = normalize(hit.position - sphere.center);
				hit.mtl = sphere.mtl;
				foundHit = true;
			}
		}
	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			
			// TO-DO: Initialize the reflection ray
			r.pos = hit.position + hit.normal * 0.05; // bias
			r.dir = reflect(-view, hit.normal); // reflect view vector
			
			if ( IntersectRay( h, r ) ) {
				// TO-DO: Hit found, so shade the hit point
				// TO-DO: Update the loop variables for tracing the next reflection ray

				view = normalize(-r.dir);
				vec3 reflectedColor = Shade(h.mtl, h.position, h.normal, view);
				clr += k_s * reflectedColor;
				k_s *= h.mtl.k_s; // next bounce
				hit = h;

			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 1 );	// return the environment color
	}
}
`;