Vue.component('dice', {
	template: `
		<div class="component">
			<p class="dice">
				<span v-for="(item, index) in faces" v-html="'&#x268'+(item-1)" v-bind:class="{'six': item==6}"></span>
			</p>
		</div>
	`,
	props: {
		n:	{ type: Number, default: 3 },
	},
	data: function () {
		return {
			faces: [],
			repeating: false,
			repeat_cycle_length: 16,
			repeat_cycle_step: 0,
			my_slide: null,
		}
	},
	mounted: function() {
		EventBus.$on('fragmentMethod', params => {
			if (params.id == this.$parent.$el.id) {
				if (params.method == 'rerandomize') {
					this.rerandomize();
				}
				if (params.method == 'toggle_repeat') {
					this.toggle_repeat();
				}
			}
		});

		this.rerandomize();
		d3.interval(this.repeat, 20);
	},
	methods: {
		rerandomize: function() {
			this.faces = Array(this.n).fill(1).map(function(i) { return Math.ceil(Math.random()*6) });
		},
		toggle_repeat: function() {
			this.repeating = !this.repeating;
			this.my_slide = Reveal.getIndices().h;
			this.repeat_cycle_length = 16;
			this.repeat_cycle_step = this.repeat_cycle_length - 1;
		},
		repeat: function() {
			if (this.repeating && Reveal.getIndices().h == this.my_slide && !this.all_sixes()) {
				this.repeat_cycle_step++;
				if (this.repeat_cycle_length == this.repeat_cycle_step) {
					this.rerandomize();
					this.repeat_cycle_length = Math.max(1, this.repeat_cycle_length - 2);
					this.repeat_cycle_step = 0;
				}
			}
		},
		all_sixes: function() {
			return this.faces.reduce(function(a,b) {return a+b}) == 6*this.faces.length;
		},
	}
});

Vue.component('rubin-model', {
	template: `
		<div class="component">
			<table class="table table-striped align-center-except-first-column">
				<thead>
					<tr>
						<th></th>
						<th>Under A</th>
						<th>Under B</th>
						<th>Treatment Effect</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(item, index) in realisation">
						<td>{{ item.name }}</td>
						<td>{{ item.a_show ? item.a : '' }}</td>
						<td>{{ item.b_show ? item.b : ''}}</td>
						<td>{{ randomize ? '' : (item.b - item.a).toFixed(1)}}</td>
					</tr>
					<tr class="text-muted">
						<td>({{ this.sample_name }})</td>
						<td>...</td>
						<td>...</td>
						<td>...</td>
					</tr>
					<tr class="info">
						<td>Average</td>
						<td>{{ this.display_ate ? avg_a.toFixed(1) : '' }}</td>
						<td>{{ this.display_ate ? avg_b.toFixed(1) : '' }}</td>
						<td><b v-if="display_ate">{{ (avg_b - avg_a).toFixed(1) }}</b></td>
					</tr>
				</tbody>
			</table>
			<p><small>[1] Rubin, Donald B. 1974. “Estimating Causal Effects of Treatments in Randomized and Nonrandomized Studies.” Journal of Educational Psychology 66 (5): 688–701.</small></p>
		</div>
	`,
	props: {
		display_ate:	 		{ type: Boolean, default: false },
		randomize:	 			{ type: Boolean, default: false },
		sample_name:	 		{ type: String, default: 'Everyone' },
	},
	data: function () {
		return {
			sample: [
				{ name: 'Alice', a: 0.4, b: 0.9, a_show: 1, b_show: 1 },
				{ name: 'Bob', a: 0.3, b: 0.8, a_show: 1, b_show: 1 },
				{ name: 'Charlie', a: 0.5, b: 1, a_show: 1, b_show: 1 },
				{ name: 'Dave', a: 0.2, b: 0.7, a_show: 1, b_show: 1 },
				{ name: 'Eve', a: 0.4, b: 0.9, a_show: 1, b_show: 1 },
				{ name: 'Frank', a: 0.1, b: 0.6, a_show: 1, b_show: 1 }
			],
			assignment: [],
			repeating: false,
			my_slide: null,
		}
	},
	mounted: function() {
		EventBus.$on('fragmentMethod', params => {
			if (params.id == this.$parent.$el.id) {
				if (params.method == 'rerandomize') {
					this.rerandomize();
				}
				if (params.method == 'toggle_repeat') {
					this.toggle_repeat();
				}
			}
		});

		this.rerandomize();
		d3.interval(this.repeat, 250);
	},
	computed: {
		avg_a: function() {
			return	this.realisation
						.map(function(z) { return z.a == 'Yes' ? 1 : z.a == 'No' ? 0 : z.a })
						.reduce(function(a, b) { return a + b; }) /
					this.realisation
						.map(function(z) { return z.a_show })
						.reduce(function(a, b) { return a + b; });
		},
		avg_b: function() {
			return	this.realisation
						.map(function(z) { return z.b == 'Yes' ? 1 : z.b == 'No' ? 0 : z.b })
						.reduce(function(a, b) { return a + b; }) /
					this.realisation
						.map(function(z) { return z.b_show })
						.reduce(function(a, b) { return a + b; });
		},
		realisation: function() {
			if (!this.randomize) {
				return this.sample;
			} else {
				var c = this.assignment;
				return this.sample.map(
					function(row, index) {
						return {
							name: row.name,
							a: Math.random() < (row.a * c[index]) ? 'Yes' : 'No',
							a_show: c[index],
							b: Math.random() < (row.b * (1-c[index])) ? 'Yes' : 'No',
							b_show: (1-c[index])
						}
					}
				);
			}
		},
	},
	methods: {
		complete_randomize: function() {
			var n = this.sample.length;
			var m = Math.ceil(n / 2);
			return Array(m).fill(1).concat(Array(n-m).fill(0)).shuffle();
		},
		rerandomize: function() {
			this.assignment = this.complete_randomize();
		},
		toggle_repeat: function() {
			this.repeating = !this.repeating;
			this.my_slide = Reveal.getIndices().h;
		},
		repeat: function() {
			if (this.repeating && Reveal.getIndices().h == this.my_slide) { this.rerandomize(); }
		},
	}
});

Vue.component('simulation', {
	template: `
		<div class="container">
			<div class="stretch chart-container"></div>

				<table class="table table-striped">
					<thead>
						<tr>
							<th v-if="display_true_effect" class="align-center">simulated effect</th>
							<th v-if="display_observed_effect" class="align-center">average observed effect</th>
							<th v-if="display_type_i" class="align-center">type-I error rate</th>
							<th v-if="display_type_ii" class="align-center">type-II error rate</th>
							<th v-if="display_power" class="align-center">observed power</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td v-if="display_true_effect" class="align-center big-font">{{this.effect}}</td>
							<td v-if="display_observed_effect" class="align-center big-font">{{averages.total ? averages.total.toFixed(3) : "-"}}</td>
							<td v-if="display_type_i" class="align-center big-font">{{type_i_error.toLocaleString('us', {style: 'percent'})}}</td>
							<td v-if="display_type_ii" class="align-center big-font">{{type_ii_error.toLocaleString('us', {style: 'percent'})}}</td>
							<td v-if="display_power" class="align-center big-font">{{power.toLocaleString('us', {style: 'percent'})}}</td>
						</tr>
					</tbody>
				</table>

			<p><small class="text-muted"><mark v-if="n != 1000"><var>n</var> = <var>{{n}}</var></mark><span v-if="n == 1000"><var>n</var> = <var>{{n}}</var></span>, <var>base conversion rate</var> = <var>{{cr}}</var>, <var>effect of treatment</var> = <var>{{effect}}</var><span v-if="peek > 1">, <mark>peeking {{peek}} times</mark></span></small></p>
		</div>
	`,
	props: {
		effect: 					{ type: Number, default: 0 },
		n:  						{ type: Number, default: 1000 },
		peek:						{ type: Number, default: 1 },
		display_true_effect: 		{ type: Boolean, default: false },
		display_observed_effect:	{ type: Boolean, default: false },
		display_type_i:				{ type: Boolean, default: false },
		display_type_ii:			{ type: Boolean, default: false },
		display_power: 				{ type: Boolean, default: false },
	},
	data: function () {
		return {
			w: 1140,
			h: 500,
			margin: {top: 10, right: 20, bottom: 20, left: 20},
			bins: 200,
			cr: 0.1,
			bounds: [-0.2,0.2],
			results: { significant: [], insignificant: [], significant_opposite: [] },
			g: '',
			repeating: false,
			my_slide: null,
		}
	},
	computed: {
		width: function() { return +this.w - this.margin.left - this.margin.right },
		height: function() { return +this.h - this.margin.top - this.margin.bottom},
		averages: function() {
			var a = {}, total_sum = 0;
			for (var k in this.results) {
				if (this.results[k].length == 0) {
					a[k] = NaN;
				} else {
					var sum = this.results[k].reduce(function(a, b) { return a + b; });
					a[k] = sum / this.results[k].length;
					total_sum += sum;
				}
			}
			a.total = total_sum / this.trials;
			return a;
		},
		average_abs_effect: function() {
			return ((this.averages.significant * this.results.significant.length) +
					(Math.abs(this.averages.significant_opposite||0) * this.results.significant_opposite.length))
					/ (this.results.significant.length + this.results.significant_opposite.length);
		},
		type_i_error: function() {
			if (this.effect != 0) return "-"; // if null is false, type-I error is undefined.
			if (this.trials == 0) return "-";
			if (this.results.significant.length + this.results.significant_opposite.length == 0) return 0;
			return (this.results.significant.length + this.results.significant_opposite.length) / this.trials;
		},
		type_ii_error: function() {
			if (this.effect == 0) return "-"; // if null is true, type-II error is undefined.
			if (this.trials == 0) return "-";
			return 1 - this.power;
		},
		type_m_error: function() {
			return this.average_abs_effect / this.effect;
		},
		type_s_error: function() {
			return this.results.significant_opposite.length / (this.results.significant.length + this.results.significant_opposite.length);
		},
		trials: function() {
			return this.results.significant.length + this.results.significant_opposite.length + this.results.insignificant.length;
		},
		power: function() {
			if (this.effect == 0) return "-"; // if null is true, power is undefined.
			if (this.trials == 0) return "-";
			return (this.results.significant.length + this.results.significant_opposite.length) / this.trials;
		}
	},
	mounted: function() {
		EventBus.$on('fragmentMethod', params => {
			if (params.id == this.$parent.$el.id) {
				if (params.method == 'step') {
					this.step();
				}
				if (params.method == 'toggle_repeat') {
					this.toggle_repeat();
				}
			}
		});

		var svg = d3.select(this.$el).select('.chart-container').append("svg")
			.attr("width", '100%')
			.attr("height", '100%')
			.attr('viewBox','0 0 '+this.w+' '+this.h)
			.attr('preserveAspectRatio','xMinYMin');

		this.g = d3.select(this.$el).select("svg").append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
		this.update(this.results);
		d3.interval(this.repeat, 100);
	},
	methods: {
		update: function(data) {
			var x = d3.scaleLinear().domain(this.bounds).rangeRound([0, this.width]);
			var histogram = d3.histogram().domain(x.domain()).thresholds(x.ticks(this.bins));
			var b1 = histogram(this.results.significant);
			var b2 = histogram(this.results.significant_opposite);
			var b3 = histogram(this.results.insignificant);
			var b = d3.stack().keys(d3.range(3))(d3.transpose([b1.map(function(d) {return d.length}),b2.map(function(d) {return d.length}),b3.map(function(d) {return d.length})]));
			var y = d3.scaleLinear().domain([0, d3.max(b[2], function(d) { return d[1]; })]).range([this.height, 0]);
			var color = d3.scaleOrdinal().domain(d3.range(3)).range(d3.schemeCategory20);
			var colorsort = [0,0,1];

			var series = this.g.selectAll(".series").data(b);
			series.enter().append("g")
					.attr("class", "series")
					.attr("fill", function(d, i) { return color(colorsort[i]); })
				.merge(series);

			var rect = series.selectAll("rect").data(function(d) { return d; });
			rect.enter().append("rect")
					.attr("x", 1)
					.attr("width", x(b1[0].x1) - x(b1[0].x0))
					.attr("transform", function(d, i) { return "translate(" + x(b1[i].x0) + "," + y(d[0]) + ")"; })
					.attr("height", 0)
				.merge(rect)
					.transition().duration(100)
						.attr("transform", function(d, i) { return "translate(" + x(b1[i].x0) + "," + y(d[1]) + ")"; })
						.attr("height", function(d) { return y(0) - y(d[1]-d[0]); });

			this.g.selectAll(".axis").remove();
			this.g.append("g")
				.attr("class", "axis axis--x")
				.attr("transform", "translate(0," + this.height + ")")
				.call(d3.axisBottom(x));
		},
		step: function() {
			for (var j = 0; j < Math.min(100,10**(""+(this.trials)).length/10); ++j) {
				var base_n  = 0; var var_n = 0; var base_c = 0; var var_c = 0;
				for (var k = 0; k < this.peek; ++k) {
					var n_add = Math.ceil(this.n / this.peek);

					var base_n_add = this.rbinom(n_add, 0.5);
					var var_n_add = n_add - base_n_add;

					base_n += base_n_add;
					var_n += var_n_add;

					base_c += this.rbinom(base_n_add, this.cr);
					var_c += this.rbinom(var_n_add, (this.cr + this.effect));

					effect = (var_c/var_n) - (base_c/base_n);
					gval = calculate_g_test([[base_n - base_c, base_c], [var_n - var_c, var_c]]);

					if (gval >= 3.841459) {
						break;
					}
				}

				if (gval >= 3.841459) {
					if (effect > 0) {
						this.results.significant.push(effect);
					} else {
						this.results.significant_opposite.push(effect);
					}
				} else {
					this.results.insignificant.push(effect);
				}
			}
		},
		toggle_repeat: function() {
			this.repeating = !this.repeating;
			this.my_slide = Reveal.getIndices().h;
		},
		repeat: function() {
			if (this.repeating && Reveal.getIndices().h == this.my_slide) { this.step(); }
		},
		rbinom: function(n, p) {
			var b = 0;
			for (var i = 0; i < n; ++i) { if (Math.random() < p) ++b; };
			return b;
		},
	},
	watch: {
		trials: function(val) { this.update(val) }
	}
});

// This takes an array of arrays of any size, and calculates
// the raw g-test value.  It assumes a square matrix of arguments.
function calculate_g_test (data) {
	var rows = data.length;
	var columns = data[0].length;

	// Initialize our subtotals
	var row_totals = [];
	for (var i = 0; i < rows; i++) {
		row_totals[i] = 0;
	}

	var column_totals = [];
	for (var j = 0; j < columns; j++) {
		column_totals[j] = 0;
	}

	var total = 0;

	// First we calculate the totals for the row and the column
	for (var i = 0; i < rows; i++) {
		for (var j = 0; j < columns; j++) {
			var entry = data[i][j] - 0;  // - 0 ensures numeric
			row_totals[i]    += entry;
			column_totals[j] += entry;
			total            += entry;
		}
	}

	// Now we calculate the g-test contribution from each entry.
	var g_test = 0;;
	for (var i = 0; i < rows; i++) {
		for (var j = 0; j < columns; j++) {
			var expected = row_totals[i] * column_totals[j] / total;
			var seen     = data[i][j];

			g_test      += 2 * seen * Math.log( seen / expected );
		}
	}

	return g_test;
};

// Shuffle an array. 'Borrowed' from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
Array.prototype.shuffle = function() {
	var currentIndex = this.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

	// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = this[currentIndex];
		this[currentIndex] = this[randomIndex];
		this[randomIndex] = temporaryValue;
	}

	return this;
}
