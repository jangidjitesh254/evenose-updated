import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Calendar, MapPin, Users, Trophy, Filter, X, Sparkles } from 'lucide-react';
import { hackathonAPI } from '../services/api';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { format } from 'date-fns';

export default function Hackathons() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    mode: '',
  });

  useEffect(() => {
    fetchHackathons();
  }, [filters]);

  const fetchHackathons = async () => {
    try {
      const response = await hackathonAPI.getAll(filters);
      setHackathons(response.data.hackathons);
    } catch (error) {
      console.error('Failed to fetch hackathons:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      mode: '',
    });
  };

  const hasActiveFilters = filters.search || filters.status || filters.mode;

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-600">Explore Opportunities</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
            Discover <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Hackathons</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find and join exciting hackathons from around the world
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-gray-900">Filters</h3>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  icon={X}
                  className="text-gray-600 hover:text-red-600"
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  icon={Search}
                  placeholder="Search hackathons..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white"
              >
                <option value="">All Status</option>
                <option value="registration_open">Registration Open</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={filters.mode}
                onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white"
              >
                <option value="">All Modes</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <p className="text-gray-600">
              Found <span className="font-bold text-gray-900">{hackathons.length}</span> hackathon{hackathons.length !== 1 ? 's' : ''}
            </p>
          </motion.div>
        )}

        {/* Hackathons Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-gray-100 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : hackathons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-12 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No hackathons found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="primary">
                Clear Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((hackathon, index) => (
              <motion.div
                key={hackathon._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/hackathons/${hackathon._id}`}>
                  <div className="group bg-white border-2 border-gray-200 rounded-3xl overflow-hidden hover:border-indigo-300 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    {/* Banner */}
                    <div className="relative h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
                      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Badge variant={hackathon.status === 'registration_open' ? 'success' : 'secondary'}>
                          {hackathon.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <Badge variant="info">{hackathon.mode}</Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {hackathon.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                        {hackathon.description}
                      </p>

                      {/* Info Grid */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-gray-700 font-medium">
                            {format(new Date(hackathon.hackathonStartDate), 'MMM dd, yyyy')}
                          </span>
                        </div>

                        {hackathon.venue?.city && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-gray-700 font-medium">
                              {hackathon.venue.city}, {hackathon.venue.country}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-gray-700 font-medium">
                            {hackathon.currentRegistrations}/{hackathon.maxTeams} teams
                          </span>
                        </div>
                      </div>

                      {/* Registration Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                          <span>Registration</span>
                          <span className="font-semibold">
                            {Math.round((hackathon.currentRegistrations / hackathon.maxTeams) * 100)}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${(hackathon.currentRegistrations / hackathon.maxTeams) * 100}%` 
                            }}
                            transition={{ duration: 0.8, delay: index * 0.05 + 0.3 }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        {!loading && hackathons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-gray-200 rounded-3xl p-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                Ready to Host Your Own?
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Create and manage your hackathon with our powerful platform. 
                From registration to judging, we've got you covered.
              </p>
              <Link to="/create-hackathon">
                <Button variant="primary" size="lg">
                  Create Hackathon
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}