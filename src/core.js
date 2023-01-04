const cloneDeep = (object) => {
  const target = {};
  for (let i in object) {
    if (object[i] != null && typeof object[i] === 'object') {
      target[i] = cloneDeep(object[i]);
    } else {
      target[i] = object[i];
    }
  }
  return target;
};

const nullOrUndefined = (value) => {
  return value === null || value === undefined;
};

const executeAfterRendering = (callback) => {
  setTimeout(callback, 0);
};

const core = (() => {
  const info = {
    $rootElement: null,
    appNode: null,
    prevNode: null,
    currentStateKey: 0,
    effectDependencyKey: 0,
    state: {},
    newState: {},
    dependencies: {},
  };

  const addEvent = ($el, onEventType, callback) => {
    const [, eventType] = onEventType.split('on');
    $el.addEventListener(eventType.toLowerCase(), callback);
  };

  const h = (tag, props, ...children) => {
    return { tag, props, children };
  };

  const updateAttribute = ($target, newProps = {}, oldProps = {}) => {
    const props = Object.assign({}, newProps, oldProps);
    Object.keys(props).forEach((key) => {
      if (newProps[key]) {
        $target.setAttribute(key, newProps[key]);
      } else {
        $target.removeAttribute(key);
      }
    });
  };

  const updateElement = (parent, newNode, oldNode, index = 0) => {
    // console.log(newNode, oldNode);
    if (nullOrUndefined(newNode) && !nullOrUndefined(oldNode)) {
      return parent.removeChild(parent.childNodes[index]);
    }

    if (!nullOrUndefined(newNode) && nullOrUndefined(oldNode)) {
      return parent.appendChild(createElement(newNode));
    }

    if (typeof newNode === 'string' && typeof oldNode === 'string') {
      if (newNode !== oldNode) {
        return (parent.childNodes[index].textContent = newNode);
      }
    }

    if (newNode.tag !== oldNode.tag) {
      return parent.replaceChild(
        createElement(newNode),
        parent.childNodes[index]
      );
    }

    if (
      typeof newNode.tag === 'function' &&
      typeof oldNode.tag === 'function'
    ) {
      return updateElement(
        parent,
        newNode.tag({ ...newNode.props, children: newNode.children }),
        oldNode.tag({ ...oldNode.props, children: oldNode.children }),
        index
      );
    }

    if (newNode.tag === oldNode.tag) {
      const $target = parent.childNodes[index];
      updateAttribute($target, newNode.props, oldNode.props);
      const newLength = newNode.children?.length;
      const oldLength = oldNode.children?.length;
      const maxLength = Math.max(newLength, oldLength);
      for (let i = 0; i < maxLength; i++) {
        const newNodeChild =
          typeof newNode.children[i].tag === 'function'
            ? newNode.children[i].tag({
                ...newNode.props,
                children: newNode.children,
              })
            : newNode.children[i];
        const oldNodeChild =
          typeof oldNode.children[i].tag === 'function'
            ? oldNode.children[i].tag({
                ...oldNode.props,
                children: oldNode.children,
              })
            : oldNode.children[i];
        updateElement($target, newNodeChild, oldNodeChild, i);
      }
    }
  };

  const createElement = ({ tag, props, children }) => {
    if (typeof tag === 'function') {
      return createElement(tag({ ...props, children }));
    }

    const $element = document.createElement(tag);

    const $children = children.flat();

    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        if (key.slice(0, 2) === 'on') {
          addEvent($element, key, value);
        } else if (key === 'ref') {
          value.current = $element;
        } else {
          $element.setAttribute(key, value);
        }
      });
    }

    $children.forEach((childElement) => {
      if (!childElement) return;
      if (typeof childElement === 'string') {
        $element.appendChild(document.createTextNode(childElement));
      } else {
        $element.appendChild(createElement(childElement));
      }
    });

    return $element;
  };

  const render = (appNode) => {
    if (!info.appNode) {
      info.appNode = appNode;
    }
    console.log('렌더링');
    info.currentStateKey = 0;
    info.effectDependencyKey = 0;
    updateElement(info.$rootElement, info.appNode, info.prevNode);
    info.prevNode = cloneDeep(info.appNode);
    // info.$rootElement.innerHTML = '';
    // info.$rootElement.appendChild(info.$app());
  };

  const batching = (callback) => {
    const TIME = 1000 / 60; // 16ms
    let timeoutIndex = -1;
    return (...args) => {
      clearTimeout(timeoutIndex);
      timeoutIndex = setTimeout(() => {
        callback(...args);
        render();
      }, TIME);
    };
  };

  const useRef = (defaultValue) => {
    return {
      current: defaultValue,
    };
  };

  const useState = (defaultValue, caller) => {
    const { currentStateKey } = info; // 현재 key 저장
    const isNewUseState =
      info.state[`${caller}-${currentStateKey}`] === undefined;

    console.log(isNewUseState, info.state, currentStateKey);
    if (isNewUseState) {
      info.state[`${caller}-${currentStateKey}`] = defaultValue;
    }

    const value = info.state[`${caller}-${currentStateKey}`];

    const setValue = (newValue) => {
      console.log('setState');
      info.state[`${caller}-${currentStateKey}`] = newValue;
    };

    info.currentStateKey += 1;
    return [value, batching(setValue)];
  };

  const useEffect = (callback, dependencyList) => {
    const { effectDependencyKey } = info; // 현재 key 저장

    const isNewEffect =
      Object.values(info.dependencies).length === effectDependencyKey;

    if (isNewEffect) {
      info.dependencies[effectDependencyKey] = JSON.stringify(dependencyList);
    }

    const isUpdate =
      info.dependencies[effectDependencyKey] !==
        JSON.stringify(dependencyList) && dependencyList.length !== 0;

    if (isUpdate || isNewEffect) {
      executeAfterRendering(callback);
    }
    info.effectDependencyKey += 1;
  };

  const createRoot = ($element) => {
    info.$rootElement = $element;
    return info.$rootElement;
  };

  return { render, createRoot, useRef, useState, useEffect, createElement, h };
})();

export default core;
