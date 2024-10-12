import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import '../style/Home.css';

const HomePage = () => {
    const { user } = useAuth();
    const isAuthenticated = !!user;

    return (
        <>
            {/* Background Image Section */}
            <div
                className="background-image-section"
                style={{
                    backgroundImage: `url(${process.env.PUBLIC_URL}/images/WG_OUTSIDE_AUT.webp)`,
                }}
            >
                <div className="welcome-message">
                    <h1>Welcome to the AUT Events<br />Induction Platform!</h1>
                </div>
            </div>

            {/* Let's Get Started Section */}
            <div className="get-started-content">
                {!isAuthenticated ? (
                    <>
                        <h3>Let's get started</h3>
                        <p>Please sign in to view and complete your inductions.</p>
                        <Link to="/signin" className="sign-in-button">Sign in</Link>
                    </>
                ) : (
                    <>
                        <h2>Hi {user.email}, Let's get started</h2>
                        <p>You have {user.inductionsCount} inductions to complete.</p>
                        <Link to="http://localhost:3000/formlist" className="view-inductions-button">View my Inductions</Link>
                    </>
                )}
                <div style={{ marginBottom: '40px' }} />
            </div>

            {/* About Us Section */}
            <div className="about-us-section">
                <h2>About Us</h2>
                <div className="about-us-container">
                    <p>
                        "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."
                    </p>
                    <p>
                        "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"
                    </p>
                </div>
                <div style={{ marginBottom: '40px' }} />
            </div>

            {/* Feedback Section */}
            <div className="feedback-section">
                <h2>Feedback - We’d love to hear from you!</h2>
                <p>"At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."</p>
                <Link to="/contact" className="contact-button">Contact us</Link>
            </div>
            <div style={{ marginBottom: '20px' }} />
        </>
    );
};

export default HomePage;