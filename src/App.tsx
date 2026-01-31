import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { LectureSession } from './pages/LectureSession';
import { PostLectureReview } from './pages/PostLectureReview';
import { AuthProvider } from './context/AuthContext';

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/lecture/:id" element={<LectureSession />} />
                    <Route path="/lecture/:id/review" element={<PostLectureReview />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}
