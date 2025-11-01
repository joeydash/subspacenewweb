import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="card group">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative overflow-hidden h-64">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Quick actions */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
            <button 
              className="bg-white text-dark-900 p-2 rounded-full hover:bg-indigo-500 hover:text-white transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
            <button className="bg-white text-dark-900 p-2 rounded-full hover:bg-indigo-500 hover:text-white transition-colors">
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-lg mb-1 text-white">{product.name}</h3>
          <div className="flex justify-between items-center">
            <span className="text-indigo-400 font-medium">${product.price.toFixed(2)}</span>
            <span className="text-sm text-gray-400">{product.category}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;