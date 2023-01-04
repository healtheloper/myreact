import { cloneDeep } from 'lodash';

const nullOrUndefined = (value) => {
  return value === null || value === undefined;
};

const executeAfterRendering = (callback) => {
  setTimeout(callback, 0);
};

const core = (() => {
  const info = {
    $rootElement: null,
    app: null,
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
    if (typeof tag === 'function') {
      return tag({ ...props, children });
    }
    return { tag, props, children: children.flat() };
  };

  const updateAttribute = ($target, newProps = {}, oldProps = {}) => {
    const props = Object.assign({}, newProps, oldProps);
    Object.keys(props).forEach((key) => {
      if (newProps[key]) {
        if (key.startsWith('on')) {
          addEvent($target, key, newProps[key]);
        } else {
          $target.setAttribute(key, newProps[key]);
        }
      } else {
        if (key.startsWith('on')) {
          const [, eventType] = key.split('on');
          $target.removeEventListener(eventType.toLowerCase(), oldProps[key]);
        } else {
          $target.removeAttribute(key);
        }
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
      return;
    }

    if (newNode.tag !== oldNode.tag) {
      return parent.replaceChild(
        createElement(newNode),
        parent.childNodes[index]
      );
    }

    if (newNode.tag === oldNode.tag) {
      const $target = parent.childNodes[index];
      updateAttribute($target, newNode.props, oldNode.props);
      const newLength = newNode.children?.length;
      const oldLength = oldNode.children?.length;
      const maxLength = Math.max(newLength, oldLength);
      for (let i = 0; i < maxLength; i++) {
        updateElement($target, newNode.children[i], oldNode.children[i], i);
      }
    }
  };

  const createElement = ({ tag, props, children }) => {
    const $element = document.createElement(tag);
    // const $children = children.flat();

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

    children.forEach((childElement) => {
      if (!childElement) return;
      if (typeof childElement === 'string') {
        $element.appendChild(document.createTextNode(childElement));
      } else {
        $element.appendChild(createElement(childElement));
      }
    });

    return $element;
  };

  const render = (app) => {
    if (!info.app) {
      info.app = app;
    }
    info.currentStateKey = 0;
    info.effectDependencyKey = 0;
    const appNode = info.app();
    console.log('렌더링');

    updateElement(info.$rootElement, appNode, info.prevNode);
    info.prevNode = cloneDeep(appNode);
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

    if (isNewUseState) {
      info.state[`${caller}-${currentStateKey}`] = defaultValue;
    }

    const value = info.state[`${caller}-${currentStateKey}`];

    const setValue = (newValue) => {
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
