
const load = (html) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    const createCheerioWrapper = (elements) => {
        // Ensure elements is an array
        const els = Array.isArray(elements) ? elements : [elements];

        const wrapperObj = (selector) => {
            if (!selector) return createCheerioWrapper([]);

            // If selector is a function (like in .each((i, el) => $(el)))
            // But here $(el) calls the main load function result, which is this wrapperObj?
            // No, load returns a function $
            // $(selector) returns wrapper
            // $(element) returns wrapper

            if (typeof selector === 'string') {
                const found = [];
                els.forEach(el => {
                    if (el.querySelectorAll) {
                        found.push(...Array.from(el.querySelectorAll(selector)));
                    }
                });
                return createCheerioWrapper(found);
            } else if (selector.nodeType) {
                return createCheerioWrapper([selector]);
            }
            return createCheerioWrapper([]);
        };

        // Add methods to the wrapper function/object
        wrapperObj.length = els.length;

        wrapperObj.each = (callback) => {
            els.forEach((el, i) => callback.call(el, i, el));
            return wrapperObj;
        };

        wrapperObj.find = (selector) => {
            const found = [];
            els.forEach(el => {
                if (el.querySelectorAll) {
                    found.push(...Array.from(el.querySelectorAll(selector)));
                }
            });
            return createCheerioWrapper(found);
        };

        wrapperObj.text = () => els.map(el => el.textContent).join('');

        wrapperObj.attr = (name) => {
            if (els.length === 0) return undefined;
            return els[0].getAttribute(name);
        };

        wrapperObj.html = () => els.length > 0 ? els[0].innerHTML : '';

        wrapperObj.parent = () => {
            const parents = els.map(el => el.parentElement).filter(p => p);
            return createCheerioWrapper(parents);
        };

        wrapperObj.first = () => createCheerioWrapper(els.slice(0, 1));

        return wrapperObj;
    };

    return (selector) => {
        if (typeof selector === 'string') {
            return createCheerioWrapper(Array.from(wrapper.querySelectorAll(selector)));
        } else if (selector && selector.nodeType) {
            return createCheerioWrapper([selector]);
        }
        return createCheerioWrapper([]);
    };
};

module.exports = {
    load: load,
};
