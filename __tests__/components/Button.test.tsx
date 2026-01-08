import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@/app/components/Button';

describe('Button Component', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick} disabled>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply primary variant by default', () => {
    const { container } = render(<Button>Primary</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-design-button-primary');
  });

  it('should apply secondary variant', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-design-surface-default');
  });

  it('should apply outline variant', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('border');
  });

  it('should apply destructive variant', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('text-red-600');
  });

  it('should apply ghost variant', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-transparent');
  });

  it('should apply default size classes', () => {
    const { container } = render(<Button>Default</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('h-[44px]');
  });

  it('should apply small size classes', () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('h-[36px]');
  });

  it('should apply large size classes', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('h-[52px]');
  });

  it('should apply icon size classes', () => {
    const { container } = render(<Button size="icon">Icon</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('h-[44px]');
    expect(button?.className).toContain('w-[44px]');
  });

  it('should apply custom className', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('custom-class');
  });

  it('should have disabled attribute when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
  });

  it('should have correct type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should pass through additional props', () => {
    render(<Button data-testid="custom-button" aria-label="Custom button">Button</Button>);
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('aria-label', 'Custom button');
  });
});

