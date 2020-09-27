var points = [
		createPoint(100, 100, 0, 0, 0, true),
		createPoint(100, 200),
		createPoint(200, 200),
		createPoint(200, 100)
	],
	sticks = [
		createStick(points[0], points[1], 0.1),
		createStick(points[1], points[2], 0.1),
		createStick(points[2], points[3], 0.1),
		createStick(points[3], points[0], 0.1),
		createStick(points[0], points[2], 0.1, true)
	],
	forms = [
		createForm(points[0], points[1], points[2], points[3]).setColour(255, 0, 255)
	],
	gravity = 0.5,
	friction = 0.999,
	wallBounce = 0.9;

function createPoint(x, y, radius, vx, vy, pinned)
{
	return {
		x: x,
		y: y,
		px: x - (vx ? vx : 0),
		py: y - (vy ? vy : 0),
		radius: radius ? radius : 0,
		pinned: pinned
	};
}

function createStick(p0, p1, k, hidden, dist)
{
	return {
		p0: p0,
		p1: p1,
		k: k,
		hidden: hidden,
		dist: dist ? dist : Math.sqrt((p1.x - p0.x) * (p1.x - p0.x) + (p1.y - p0.y) * (p1.y - p0.y))
	};
}

function createForm(...args)
{
	var form = {path: args};
	form.setColour = (r, g, b, a) => {
		form.colour = {
			r: r,
			g: g,
			b: b,
			a: a == undefined ? 255 : a
		};
		return form;
	};
	return form;
}

function setup()
{
	let canvas = createCanvas(800, 600);
	canvas.parent("canvas-container");
}

function tick()
{
	points.forEach(p => {
		// Check if pinned
		if (p.pinned)
			return;

		// Get velocity
		var vx = (p.x - p.px) * friction,
			vy = (p.y - p.py) * friction;
		p.px = p.x;
		p.py = p.y;

		// Update position
		p.x += vx;
		p.y += vy + gravity;
	});

	for (let i = 0; i < 3; i++)
	{
		sticks.forEach(s => {
			// Get the difference in distances
			var dx = s.p1.x - s.p0.x,
				dy = s.p1.y - s.p0.y,
				distance = Math.sqrt(dx * dx + dy * dy),
				distDiff = distance - s.dist;

			// Stick is actually a spring
			if (s.k && i == 0)
			{
				var angle = Math.atan2(dy, dx),
					fx = s.k * distDiff / 2 * Math.cos(angle),
					fy = s.k * distDiff / 2 * Math.sin(angle);

				// Update p0
				if (!s.p0.pinned)
				{
					s.p0.x += fx;
					s.p0.y += fy;
				}

				// Update p1
				if (!s.p1.pinned)
				{
					s.p1.x -= fx;
					s.p1.y -= fy;
				}
			// Stick is not a spring
			} else if (!s.k)
			{
				// Get the percent
				var percent = distDiff / s.dist / 2;

				// Update p0
				if (!s.p0.pinned)
				{
					s.p0.x += dx * percent;
					s.p0.y += dy * percent;
				}

				// Update p1
				if (!s.p1.pinned)
				{
					s.p1.x -= dx * percent;
					s.p1.y -= dy * percent;
				}
			}
		});

		points.forEach(p => {
			var vx = p.x - p.px,
				vy = p.y - p.py;

			// Collide with the wall
			if (p.x + p.radius > width)
			{
				p.x = width - p.radius;
				p.px = p.x + vx * wallBounce;
			} else if (p.x - p.radius < 0)
			{
				p.x = p.radius;
				p.px = p.x + vx * wallBounce;
			}
			if (p.y + p.radius > height)
			{
				p.y = height - p.radius;
				p.py = p.y + vy * wallBounce;
			} else if (p.y - p.radius < 0)
			{
				p.y = p.radius;
				p.py = p.y + vy * wallBounce;
			}
		});
	}
}

function draw()
{
	tick();

	background(255);
	fill(0);

	forms.forEach(f => {
		fill(f.colour.r, f.colour.g, f.colour.b, f.colour.a);
		beginShape();
		f.path.forEach(p => {
			vertex(p.x, p.y);
		});
		endShape(CLOSE);
	});

	fill(0);
	points.forEach(p => {
		ellipse(p.x, p.y, p.radius * 2);
	});
	sticks.forEach(s => {
		if (!s.hidden)
			line(s.p0.x, s.p0.y, s.p1.x, s.p1.y);
	});
}
