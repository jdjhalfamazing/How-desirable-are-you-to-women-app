
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.43.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.43.1 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (280:1) {:else}
    function create_else_block(ctx) {
    	let div;
    	let h1;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = `Your results: ${/*getScore*/ ctx[3]()}`;
    			t2 = space();
    			button = element("button");
    			button.textContent = "Retake!";
    			attr_dev(h1, "class", "svelte-1tthuam");
    			add_location(h1, file, 281, 3, 6302);
    			attr_dev(button, "class", "svelte-1tthuam");
    			add_location(button, file, 284, 3, 6350);
    			attr_dev(div, "class", "score-screen svelte-1tthuam");
    			add_location(div, file, 280, 2, 6272);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t2);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*restartQuiz*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(280:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (246:49) 
    function create_if_block_1(ctx) {
    	let div6;
    	let div1;
    	let h2;
    	let t0_value = /*questions*/ ctx[2][/*questionPointer*/ ctx[1]].question + "";
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let div5;
    	let div3;
    	let div2;
    	let t3;
    	let div4;
    	let button0;
    	let t4;
    	let button0_disabled_value;
    	let t5;
    	let button1;
    	let mounted;
    	let dispose;
    	let each_value = /*questions*/ ctx[2][/*questionPointer*/ ctx[1]].options;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div1 = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div5 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			t3 = space();
    			div4 = element("div");
    			button0 = element("button");
    			t4 = text("<");
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = ">";
    			add_location(h2, file, 248, 3, 5586);
    			attr_dev(div0, "class", "options svelte-1tthuam");
    			add_location(div0, file, 251, 3, 5645);
    			attr_dev(div1, "class", "main svelte-1tthuam");
    			add_location(div1, file, 247, 2, 5564);
    			set_style(div2, "width", /*questionPointer*/ ctx[1] / /*questions*/ ctx[2].length * 100 + "%");
    			attr_dev(div2, "class", "svelte-1tthuam");
    			add_location(div2, file, 262, 5, 5950);
    			attr_dev(div3, "class", "progress-bar svelte-1tthuam");
    			add_location(div3, file, 261, 3, 5918);
    			button0.disabled = button0_disabled_value = /*questionPointer*/ ctx[1] == 0;
    			attr_dev(button0, "class", "svelte-1tthuam");
    			add_location(button0, file, 270, 2, 6075);
    			attr_dev(button1, "class", "svelte-1tthuam");
    			add_location(button1, file, 273, 2, 6171);
    			attr_dev(div4, "class", "buttons svelte-1tthuam");
    			add_location(div4, file, 269, 2, 6051);
    			attr_dev(div5, "class", "footer svelte-1tthuam");
    			add_location(div5, file, 260, 2, 5894);
    			attr_dev(div6, "class", "quiz-screen svelte-1tthuam");
    			add_location(div6, file, 246, 1, 5536);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div1);
    			append_dev(div1, h2);
    			append_dev(h2, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div6, t2);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, div2);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, button0);
    			append_dev(button0, t4);
    			append_dev(div4, t5);
    			append_dev(div4, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_2*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*click_handler_3*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*questionPointer*/ 2 && t0_value !== (t0_value = /*questions*/ ctx[2][/*questionPointer*/ ctx[1]].question + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*answers, questionPointer, questions*/ 7) {
    				each_value = /*questions*/ ctx[2][/*questionPointer*/ ctx[1]].options;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*questionPointer*/ 2) {
    				set_style(div2, "width", /*questionPointer*/ ctx[1] / /*questions*/ ctx[2].length * 100 + "%");
    			}

    			if (dirty & /*questionPointer*/ 2 && button0_disabled_value !== (button0_disabled_value = /*questionPointer*/ ctx[1] == 0)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(246:49) ",
    		ctx
    	});

    	return block;
    }

    // (239:1) {#if questionPointer==-1}
    function create_if_block(ctx) {
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "How Desirable Are You To Women?";
    			attr_dev(button, "class", "svelte-1tthuam");
    			add_location(button, file, 240, 1, 5384);
    			attr_dev(div, "class", "start-screen svelte-1tthuam");
    			add_location(div, file, 239, 1, 5356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(239:1) {#if questionPointer==-1}",
    		ctx
    	});

    	return block;
    }

    // (253:4) {#each questions[questionPointer].options as opt,i}
    function create_each_block(ctx) {
    	let button;
    	let t0_value = /*opt*/ ctx[9] + "";
    	let t0;
    	let t1;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[6](/*i*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*answers*/ ctx[0][/*questionPointer*/ ctx[1]] == /*i*/ ctx[11]
    			? 'selected'
    			: '') + " svelte-1tthuam"));

    			add_location(button, file, 253, 4, 5727);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*questionPointer*/ 2 && t0_value !== (t0_value = /*opt*/ ctx[9] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*answers, questionPointer*/ 3 && button_class_value !== (button_class_value = "" + (null_to_empty(/*answers*/ ctx[0][/*questionPointer*/ ctx[1]] == /*i*/ ctx[11]
    			? 'selected'
    			: '') + " svelte-1tthuam"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(253:4) {#each questions[questionPointer].options as opt,i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*questionPointer*/ ctx[1] == -1) return create_if_block;
    		if (!(/*questionPointer*/ ctx[1] > /*answers*/ ctx[0].length - 1)) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "app svelte-1tthuam");
    			add_location(div, file, 237, 0, 5310);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let questions = [
    		{
    			"question": "What is your height?",
    			"options": [
    				"I am below average height",
    				"I am average height",
    				"I am above average height"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "What is your fitness level?",
    			"options": [
    				"To be honest I am out of shape/overweight",
    				"I have an average body",
    				"My body is pretty athletic"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "What is your game/confidence level on?",
    			"options": [
    				"I am completely inexperienced/have no game",
    				"I have average game with women",
    				"I am extremely confident/mack-daddy skills"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "What level is your style on?",
    			"options": [
    				"I can't dress to save my life",
    				"I have average style",
    				"My style is on a whole different level"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "What is your income?",
    			"options": [
    				"I don't have a job",
    				"I have average income",
    				"My income is above average"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "What level of sexual experience do you have?",
    			"options": [
    				"I am a virgin/few bodies",
    				"I have an average number of bodies",
    				"I have a crazy high number of bodies"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "Where do you rate your sexual skills?",
    			"options": [
    				"I can't please a women",
    				"I'm decent in the bedroom",
    				"I satisfy women every single time"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "How pleasant is your car?",
    			"options": ["I have no car", "I have decent car", "I have nice car"],
    			"correctIndex": 1
    		},
    		{
    			"question": "How nice is your place?",
    			"options": [
    				"I don't have my own place",
    				"It's decent, I guess!",
    				"It's pretty impressive"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "How good is your social skills?",
    			"options": [
    				"I'm socially awkward",
    				"I'm have average social skills",
    				"I have charisma and everyone loves me"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "How consistent are you on your purpose?",
    			"options": [
    				"I don't know my purpose",
    				"I know it, I'm just inconsistent",
    				"I'm on it like white on rice everyday"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "How often do you smell good around women?",
    			"options": [
    				"Never, I lack confidence",
    				"Sometimes, depending on how I feel",
    				"I always smell good around ladies"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "How often do you get compliments and flirts from women?",
    			"options": [
    				"Never, I need help!",
    				"They sometimes flirt",
    				"Women flirt all of the time"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "How often do ladies text you back?",
    			"options": [
    				"Ladies never text me back",
    				"They text back every couple of days",
    				"They always text back right away"
    			],
    			"correctIndex": 1
    		}
    	];

    	let answers = new Array(questions.length).fill(null);
    	let questionPointer = -1;

    	function getScore() {
    		let score = answers.reduce(
    			(acc, val, index) => {
    				if (questions[index].correctIndex == val) {
    					return acc + 1;
    				}

    				return acc;
    			},
    			0
    		);

    		return score / questions.length * 100 + "%";
    	}

    	function restartQuiz() {
    		$$invalidate(0, answers = new Array(questions.length).fill(null));
    		$$invalidate(1, questionPointer = 0);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(1, questionPointer = 0);
    	};

    	const click_handler_1 = i => {
    		$$invalidate(0, answers[questionPointer] = i, answers);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(1, questionPointer--, questionPointer);
    	};

    	const click_handler_3 = () => {
    		$$invalidate(1, questionPointer++, questionPointer);
    	};

    	$$self.$capture_state = () => ({
    		questions,
    		answers,
    		questionPointer,
    		getScore,
    		restartQuiz
    	});

    	$$self.$inject_state = $$props => {
    		if ('questions' in $$props) $$invalidate(2, questions = $$props.questions);
    		if ('answers' in $$props) $$invalidate(0, answers = $$props.answers);
    		if ('questionPointer' in $$props) $$invalidate(1, questionPointer = $$props.questionPointer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		answers,
    		questionPointer,
    		questions,
    		getScore,
    		restartQuiz,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
