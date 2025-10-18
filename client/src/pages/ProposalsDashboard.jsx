// client/src/pages/ProposalsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/clerk-react"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/LoadingState"; // Ensure this component exists
import EmptyState from "@/components/EmptyState"; // Ensure this component exists
import ErrorState from "@/components/ErrorState"; // Ensure this component exists
import { MessageSquare, Check, X, ArrowRight } from 'lucide-react'; 
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ProposalCard({ proposal, onAction }) {
    const { _id, skillId, offeredSkills, message, status, proposerName, proposerEmail, createdAt } = proposal;
    
    // skillId is populated as an object in the controller
    const skillTitle = skillId?.title || 'Unknown Skill';
    const skillIdVal = skillId?._id; 

    const dateSent = new Date(createdAt).toLocaleDateString();

    const renderStatusBadge = (currentStatus) => {
        let color, text;
        switch(currentStatus) {
            case 'pending':
                color = 'bg-yellow-100 text-yellow-700';
                text = 'Pending';
                break;
            case 'accepted':
                color = 'bg-green-100 text-green-700';
                text = 'Accepted';
                break;
            case 'rejected':
                color = 'bg-red-100 text-red-700';
                text = 'Rejected';
                break;
            default:
                color = 'bg-gray-100 text-gray-700';
                text = 'Unknown';
        }
        return <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>{text}</span>;
    };

    return (
        <Card className="shadow-lg border-2 border-indigo-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-indigo-700">
                    Proposal for: {skillTitle}
                </CardTitle>
                {renderStatusBadge(status)}
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-500">From: {proposerName} ({proposerEmail || 'Email not available'})</p>
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-700">Offered Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                        {offeredSkills.map((skill, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-700">Message:</h4>
                    <p className="text-sm text-gray-700 italic">"{message}"</p>
                </div>
                <div className="text-xs text-gray-400">Sent on: {dateSent}</div>
                
                {status === 'pending' && (
                    <div className="flex space-x-4 pt-2">
                        <Button
                            onClick={() => onAction(_id, 'accept')}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            <Check className="h-4 w-4 mr-2" /> Accept
                        </Button>
                        <Button
                            onClick={() => onAction(_id, 'reject')}
                            variant="outline"
                            className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                        >
                            <X className="h-4 w-4 mr-2" /> Reject
                        </Button>
                    </div>
                )}
                 {skillIdVal && (
                    <Link to={`/skills/${skillIdVal}`}>
                        <Button variant="link" className='w-full justify-center'>
                            View Skill <ArrowRight className='h-4 w-4 ml-2' />
                        </Button>
                    </Link>
                )}
            </CardContent>
        </Card>
    );
}


export default function ProposalsDashboard() {
    const { getToken } = useAuth();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProposals = async () => {
        setLoading(true);
        setError('');
        try {
            const token = await getToken(); 
            const response = await fetch(`${API_BASE_URL}/exchange/my-proposals`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();

            if (result.success) {
                setProposals(result.data);
            } else {
                setError(result.message || 'Failed to fetch proposals');
            }
        } catch (err) {
            console.error('Error fetching proposals:', err);
            setError('Failed to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (proposalId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this proposal?`)) return;

        try {
            const token = await getToken();
            const response = await fetch(`${API_BASE_URL}/exchange/${proposalId}/${action}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();

            if (result.success) {
                // Update local state to reflect the status change
                setProposals(proposals.map(p => 
                    p._id === proposalId ? { ...p, status: action, dateActioned: new Date().toISOString() } : p
                ));
            } else {
                alert(result.message || `Failed to ${action} proposal.`);
            }
        } catch (err) {
            console.error(`Error performing action ${action}:`, err);
            alert('An unexpected error occurred.');
        }
    };

    useEffect(() => {
        fetchProposals();
    }, [getToken]);

    if (loading) {
        return <LoadingState message="Loading your exchange proposals..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={fetchProposals} />;
    }

    if (proposals.length === 0) {
        return (
            <EmptyState 
                icon={MessageSquare}
                title="No Exchange Proposals"
                message="No users have proposed a skill exchange for your posted skills yet."
                actionLabel="Review Your Skills"
                onAction={() => window.location.href = '/dashboard?tab=posted'} 
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {proposals.map(proposal => (
                    <ProposalCard 
                        key={proposal._id} 
                        proposal={proposal}
                        onAction={handleAction}
                    />
                ))}
            </div>
        </div>
    );
}