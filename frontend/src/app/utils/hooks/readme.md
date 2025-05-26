# Custom hooks

The folder contains the application's custom hooks.

## useFocus

Hook for use focus on html element.

### Usage

```jsx
const [ref, setFocus] = useFocus<HTMLButtonElement>();

setFocus();

<button ref={ref}></button>
```

## useTransitionEvents

Hook for use onEnter and onExit transition's event on html element.

### Inputs

```tsx
type UseTransitionParams = {
	onEnter?: typeof nop;
	onExit?: typeof nop;
};
```

### Usage

```jsx
const ref = useTransitionEvents({
	onEnter() {
		// code executed on start transition event
	},
	onExit() {
		// code executed on end transition event
	}
});

// div with a css transition
<div ref={ref}></div>;
```

## useSticky

Hook for use sticky element event.

### Usage

```jsx
const [containerRef, isSticky] = useSticky();

<div ref={containerRef}>{isSticky ? 'is sticky' : 'not sticky'}</div>;
```

## useIntersectionObserver

Hook for intersection observer an html ref element.

### Inputs

```tsx
interface IntersectionObserverInit {
	root?: Element | Document | null;
	rootMargin?: string;
	threshold?: number | number[];
}
```

### Usage

```jsx
const [containerRef, isVisible] = useIntersectionObserver({
	root: null,
	rootMargin: '0px',
	threshold: [1]
});

<div ref={containerRef}>{isVisible ? 'visible' : 'not visible'}</div>;
```
