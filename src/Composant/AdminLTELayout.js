import React from 'react';
import { useHistory } from "react-router-dom";
import { Link } from "react-router-dom";
import Head from './Head';
import Menus from './Menus';
import Myfoot from './Myfoot';

const AdminLTELayout = ({ children, title, breadcrumb }) => {
  const history = useHistory();

  return (
    <div className="wrapper">
      <Menus />
      <Head />
      
      {/* Content Wrapper */}
      <div className="content-wrapper" style={{ backgroundColor: 'whitesmoke', minHeight: '100vh' }}>
        {/* Content Header */}
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="m-0">{title}</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item"><Link to="/tableaudebord">Dashboard</Link></li>
                  {breadcrumb && breadcrumb.map((item, index) => (
                    <li key={index} className={`breadcrumb-item ${index === breadcrumb.length - 1 ? 'active' : ''}`}>
                      {item.link ? <Link to={item.link}>{item.label}</Link> : item.label}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <section className="content">
          <div className="container-fluid">
            {children}
          </div>
        </section>
      </div>

      <Myfoot />
    </div>
  );
};

export default AdminLTELayout;