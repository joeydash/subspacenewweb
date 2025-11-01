import { Outlet, ScrollRestoration } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import NetworkStatusIndicator from './NetworkStatusIndicator';
import Loader from './Loader';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <NetworkStatusIndicator />
      <Loader />
      <Navbar />
      <main className="flex-grow mt-12">
        <Outlet />
      </main>
      <Footer />
      
      <ScrollRestoration getKey={(location) => location.pathname} />
    </div>
  );
};

export default Layout;
