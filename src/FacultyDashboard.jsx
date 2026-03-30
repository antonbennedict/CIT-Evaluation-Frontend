import React, { useState } from 'react';
import axios from 'axios';

const FacultyDashboard = () => {
    const [email, setEmail] = useState('');
    const [evals, setEvals] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const login = () => {
        axios.get(`http://localhost:8080/api/evaluations/faculty/${email}`)
            .then(res => {
                setEvals(res.data);
                setIsLoggedIn(true);
            })
            .catch(() => alert("Faculty not found or Error"));
    };

    return (
        <div style={{ padding: '40px' }}>
            {!isLoggedIn ? (
                <div>
                    <h2>Faculty Login</h2>
                    <input placeholder="Enter Faculty Email" onChange={e => setEmail(e.target.value)} />
                    <button onClick={login}>View My Evaluations</button>
                </div>
            ) : (
                <div>
                    <h2>Evaluations for {email}</h2>
                    <p style={{color: 'gray', fontSize: '12px'}}>* Student identities are hidden for confidentiality.</p>
                    <table border="1" cellPadding="10" style={{width: '100%', borderCollapse: 'collapse'}}>
                        <thead>
                            <tr>
                                <th>Section</th>
                                <th>Rating / 10</th>
                                <th>Feedback</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evals.map(ev => (
                                <tr key={ev.id}>
                                    <td>{ev.section}</td>
                                    <td>{ev.rating}</td>
                                    <td><i>[Encrypted - Viewable by Admin only]</i></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FacultyDashboard;