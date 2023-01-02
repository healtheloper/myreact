const executeAfterRendering = (callback) => {
  setTimeout(callback, 0);
};

const core = (() => {
  const info = {
    $rootElement: null,
    $app: null,
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

  const createElement = (tag, props, ...children) => {
    // 컴포넌트일때
    if (typeof tag === 'function') {
      return tag();
    }

    const $element = document.createElement(tag);
    const $children = children.flat();

    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        if (key.slice(0, 2) === 'on') {
          addEvent($element, key, value);
        } else {
          $element.setAttribute(key, value);
        }
      });
    }

    $children.forEach((childElement) => {
      if (typeof childElement === 'string') {
        $element.appendChild(document.createTextNode(childElement));
      } else {
        $element.appendChild(childElement);
      }
    });

    return $element;
  };

  const render = ($app) => {
    if (!info.$app) {
      info.$app = $app;
    }
    info.currentStateKey = 0;
    info.effectDependencyKey = 0;
    info.$rootElement.innerHTML = '';
    info.$rootElement.appendChild(info.$app());
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

  const useState = (defaultValue) => {
    const { currentStateKey } = info; // 현재 key 저장
    const isNewUseState = Object.values(info.state).length === currentStateKey;
    if (isNewUseState) {
      info.state[currentStateKey] = defaultValue;
    }
    const value = info.state[currentStateKey];

    const setValue = (newValue) => {
      info.state[currentStateKey] = newValue;
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
      console.log('update or mount');
      executeAfterRendering(callback);
    }
    info.effectDependencyKey += 1;
  };

  const createRoot = ($element) => {
    info.$rootElement = $element;
    return info.$rootElement;
  };

  return { render, createRoot, useState, useEffect, createElement };
})();

export default core;
