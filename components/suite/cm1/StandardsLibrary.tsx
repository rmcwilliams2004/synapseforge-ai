import React, { useState, useMemo } from 'react';
import { Standard } from '../../../types';
import { MOCK_STANDARDS } from '../../../constants';

export const StandardsLibrary: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ organization: 'All', status: 'All' });

    const organizations = useMemo(() => ['All', ...Array.from(new Set(MOCK_STANDARDS.map(s => s.organization)))], []);

    const filteredStandards = useMemo(() =>
        MOCK_STANDARDS.filter(s =>
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filters.organization === 'All' || s.organization === filters.organization) &&
            (filters.status === 'All' || s.status === filters.status)
        ), [searchTerm, filters]);
    
    const handleFilterChange = (filterType: 'organization' | 'status', value: string) => {
        setFilters(prev => ({ ...prev, [filterType]: value }));
    };

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-2xl font-bold text-brand-light mb-4">Project Standards & Code Library</h1>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col flex-1">
                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Search by name or description..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:ring-brand-cyan focus:border-brand-cyan md:col-span-2"
                    />
                     <select value={filters.organization} onChange={e => handleFilterChange('organization', e.target.value)} className="bg-gray-900/50 border-2 border-gray-700 rounded-lg px-4 py-2 text-gray-300">
                        {organizations.map(org => <option key={org} value={org}>{org === 'All' ? 'All Organizations' : org}</option>)}
                    </select>
                     <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="bg-gray-900/50 border-2 border-gray-700 rounded-lg px-4 py-2 text-gray-300">
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Withdrawn">Withdrawn</option>
                    </select>
                </div>

                {/* Standards List */}
                <div className="flex-1 overflow-y-auto pr-2">
                    <ul className="space-y-3">
                        {filteredStandards.map(standard => (
                            <li key={standard.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-brand-light">{standard.name}</h3>
                                        <p className="text-sm text-gray-400">{standard.organization} &bull; {standard.publicationYear}</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${standard.status === 'Active' ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'}`}>
                                        {standard.status}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-gray-300">{standard.description}</p>
                                <div className="mt-3 text-right">
                                    <button className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">Link to Design Step...</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};