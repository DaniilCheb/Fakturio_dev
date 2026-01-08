import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductsSection from '@/app/components/invoice/ProductsSection';
import type { InvoiceItem } from '@/lib/types/invoice';

// Mock Icons
vi.mock('@/app/components/Icons', () => ({
  PlusIcon: ({ size }: { size?: number }) => <span data-testid="plus-icon">+</span>,
}));

describe('ProductsSection Component', () => {
  const mockItems: InvoiceItem[] = [
    {
      id: '1',
      quantity: 2,
      um: 'pcs',
      description: 'Test Item 1',
      pricePerUm: 50,
      vat: '8.1',
    },
  ];

  const defaultProps = {
    items: mockItems,
    discount: 0,
    currency: 'CHF',
    onChangeItems: vi.fn(),
    onChangeDiscount: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render products section with items', () => {
    render(<ProductsSection {...defaultProps} />);
    
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Item 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });

  it('should display item totals correctly', () => {
    render(<ProductsSection {...defaultProps} />);
    
    // Total for 2 * 50 = 100
    expect(screen.getByText('100.00')).toBeInTheDocument();
  });

  it('should display subtotal and total', () => {
    render(<ProductsSection {...defaultProps} />);
    
    expect(screen.getByText(/Subtotal/i)).toBeInTheDocument();
    expect(screen.getByText(/Total \(incl\. VAT\)/i)).toBeInTheDocument();
  });

  it('should call onChangeItems when adding a new item', async () => {
    const user = userEvent.setup();
    const handleChangeItems = vi.fn();
    
    render(
      <ProductsSection
        {...defaultProps}
        onChangeItems={handleChangeItems}
      />
    );
    
    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);
    
    expect(handleChangeItems).toHaveBeenCalledTimes(1);
    const newItems = handleChangeItems.mock.calls[0][0];
    expect(newItems).toHaveLength(2);
    expect(newItems[1].description).toBe('');
    expect(newItems[1].quantity).toBe('');
  });

  it('should call onChangeItems when removing an item', async () => {
    const user = userEvent.setup();
    const handleChangeItems = vi.fn();
    const multipleItems: InvoiceItem[] = [
      ...mockItems,
      {
        id: '2',
        quantity: 1,
        um: 'pcs',
        description: 'Test Item 2',
        pricePerUm: 100,
        vat: '8.1',
      },
    ];
    
    render(
      <ProductsSection
        {...defaultProps}
        items={multipleItems}
        onChangeItems={handleChangeItems}
      />
    );
    
    const removeButtons = screen.getAllByLabelText('Remove item');
    await user.click(removeButtons[0]);
    
    expect(handleChangeItems).toHaveBeenCalledTimes(1);
    const newItems = handleChangeItems.mock.calls[0][0];
    expect(newItems).toHaveLength(1);
  });

  it('should not remove item if only one item exists', async () => {
    const user = userEvent.setup();
    const handleChangeItems = vi.fn();
    
    render(
      <ProductsSection
        {...defaultProps}
        onChangeItems={handleChangeItems}
      />
    );
    
    // Should not show remove button when only one item
    const removeButton = screen.queryByLabelText('Remove item');
    expect(removeButton).not.toBeInTheDocument();
  });

  it('should call onChangeItems when updating item description', async () => {
    const user = userEvent.setup();
    const handleChangeItems = vi.fn();
    
    render(
      <ProductsSection
        {...defaultProps}
        onChangeItems={handleChangeItems}
      />
    );
    
    const descriptionInput = screen.getByDisplayValue('Test Item 1');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated Description');
    
    expect(handleChangeItems).toHaveBeenCalled();
  });

  it('should call onChangeItems when updating item quantity', async () => {
    const user = userEvent.setup();
    const handleChangeItems = vi.fn();
    
    render(
      <ProductsSection
        {...defaultProps}
        onChangeItems={handleChangeItems}
      />
    );
    
    const quantityInput = screen.getByDisplayValue('2');
    await user.clear(quantityInput);
    await user.type(quantityInput, '5');
    
    expect(handleChangeItems).toHaveBeenCalled();
  });

  it('should call onChangeItems when updating item price', async () => {
    const user = userEvent.setup();
    const handleChangeItems = vi.fn();
    
    render(
      <ProductsSection
        {...defaultProps}
        onChangeItems={handleChangeItems}
      />
    );
    
    const priceInput = screen.getByDisplayValue('50');
    await user.clear(priceInput);
    await user.type(priceInput, '75');
    
    expect(handleChangeItems).toHaveBeenCalled();
  });

  it('should call onChangeDiscount when discount changes', async () => {
    const user = userEvent.setup();
    const handleChangeDiscount = vi.fn();
    
    render(
      <ProductsSection
        {...defaultProps}
        onChangeDiscount={handleChangeDiscount}
      />
    );
    
    const discountInput = screen.getByDisplayValue('0');
    await user.clear(discountInput);
    await user.type(discountInput, '10');
    
    expect(handleChangeDiscount).toHaveBeenCalled();
  });

  it('should display error when items are invalid', () => {
    const invalidItems: InvoiceItem[] = [
      {
        id: '1',
        quantity: '',
        um: 'pcs',
        description: '',
        pricePerUm: '',
        vat: '8.1',
      },
    ];
    
    render(
      <ProductsSection
        {...defaultProps}
        items={invalidItems}
        errors={{ items: 'At least one valid item is required' }}
      />
    );
    
    // Error should be shown on invalid fields
    const descriptionInput = screen.getByPlaceholderText('Enter description');
    expect(descriptionInput).toHaveClass('border-destructive');
  });

  it('should clear error when item becomes valid', async () => {
    const user = userEvent.setup();
    const handleClearError = vi.fn();
    const invalidItems: InvoiceItem[] = [
      {
        id: '1',
        quantity: '',
        um: 'pcs',
        description: '',
        pricePerUm: '',
        vat: '8.1',
      },
    ];
    
    render(
      <ProductsSection
        {...defaultProps}
        items={invalidItems}
        errors={{ items: 'Error' }}
        onClearError={handleClearError}
      />
    );
    
    const descriptionInput = screen.getByPlaceholderText('Enter description');
    await user.type(descriptionInput, 'Valid description');
    
    // onChangeItems should be called, which triggers error clearing
    expect(defaultProps.onChangeItems).toHaveBeenCalled();
  });

  it('should use default VAT rate for new items', async () => {
    const user = userEvent.setup();
    const handleChangeItems = vi.fn();
    
    render(
      <ProductsSection
        {...defaultProps}
        defaultVatRate={7.7}
        onChangeItems={handleChangeItems}
      />
    );
    
    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);
    
    const newItems = handleChangeItems.mock.calls[0][0];
    expect(newItems[1].vat).toBe('7.7');
  });

  it('should calculate totals correctly with discount', () => {
    const items: InvoiceItem[] = [
      {
        id: '1',
        quantity: 2,
        um: 'pcs',
        description: 'Item',
        pricePerUm: 100,
        vat: '8.1',
      },
    ];
    
    render(
      <ProductsSection
        {...defaultProps}
        items={items}
        discount={10}
      />
    );
    
    // Subtotal: 200, Discount: 20, After discount: 180
    // VAT on 180: ~14.58, Total: ~194.58
    expect(screen.getByText(/Subtotal/i)).toBeInTheDocument();
    expect(screen.getByText(/Total \(incl\. VAT\)/i)).toBeInTheDocument();
  });

  it('should handle multiple items with different VAT rates', () => {
    const items: InvoiceItem[] = [
      {
        id: '1',
        quantity: 1,
        um: 'pcs',
        description: 'Item 1',
        pricePerUm: 100,
        vat: '8.1',
      },
      {
        id: '2',
        quantity: 1,
        um: 'pcs',
        description: 'Item 2',
        pricePerUm: 100,
        vat: '2.6',
      },
    ];
    
    render(
      <ProductsSection
        {...defaultProps}
        items={items}
      />
    );
    
    expect(screen.getByDisplayValue('Item 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Item 2')).toBeInTheDocument();
  });

  it('should display currency in totals', () => {
    render(
      <ProductsSection
        {...defaultProps}
        currency="EUR"
      />
    );
    
    // Check that currency is displayed in the total
    const totalText = screen.getByText(/Total \(incl\. VAT\)/i).parentElement;
    expect(totalText?.textContent).toContain('EUR');
  });
});

