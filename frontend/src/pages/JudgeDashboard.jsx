import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Award, Send } from 'lucide-react';
import { hackathonAPI, teamAPI } from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function JudgeDashboard() {
  const { hackathonId } = useParams();
  
  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [scores, setScores] = useState({});
  const [remarks, setRemarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [hackathonId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hackathonRes, teamsRes] = await Promise.all([
        hackathonAPI.getById(hackathonId),
        teamAPI.getByHackathon(hackathonId),
      ]);
      
      setHackathon(hackathonRes.data.hackathon);
      setTeams(teamsRes.data.teams || []);
      if (hackathonRes.data.hackathon.rounds?.length > 0) {
        setSelectedRound(hackathonRes.data.hackathon.rounds[0]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (criteriaName, value) => {
    setScores(prev => ({ ...prev, [criteriaName]: parseInt(value) || 0 }));
  };

  const handleSubmitScores = async () => {
    if (!selectedTeam || !selectedRound) {
      toast.error('Please select a team and round');
      return;
    }

    // Validate scores
    const criteria = selectedRound.judgingCriteria || [];
    for (const criterion of criteria) {
      const score = scores[criterion.name] || 0;
      if (score < 0 || score > criterion.maxPoints) {
        toast.error(`Score for ${criterion.name} must be between 0 and ${criterion.maxPoints}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      await teamAPI.score(selectedTeam._id, {
        roundId: selectedRound._id,
        scores: Object.entries(scores).map(([criteriaName, score]) => ({
          criteriaName,
          score,
        })),
        remarks,
        feedback,
      });
      toast.success('Scores submitted successfully!');
      setScores({});
      setRemarks('');
      setFeedback('');
      fetchData();
    } catch (error) {
      console.error('Failed to submit scores:', error);
      toast.error(error.response?.data?.message || 'Failed to submit scores');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Judge Dashboard
          </h1>
          <p className="text-gray-600">{hackathon?.title}</p>
        </div>

        {/* Round Selection */}
        {hackathon?.rounds && hackathon.rounds.length > 0 && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Select Round:</h3>
            <div className="flex gap-2 flex-wrap">
              {hackathon.rounds.map((round) => (
                <Button
                  key={round._id}
                  variant={selectedRound?._id === round._id ? 'primary' : 'outline'}
                  onClick={() => setSelectedRound(round)}
                >
                  {round.name}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams List */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Teams</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {teams.map((team) => (
                  <button
                    key={team._id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTeam?._id === team._id
                        ? 'bg-red-50 border-2 border-red-600'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium">{team.name}</div>
                    <div className="text-sm text-gray-500">
                      {team.members?.length || 0} members
                    </div>
                  </button>
                ))}
              </div>
              {teams.length === 0 && (
                <p className="text-center text-gray-500 py-4">No teams yet</p>
              )}
            </Card>
          </div>

          {/* Scoring Interface */}
          <div className="lg:col-span-2">
            <Card>
              {selectedTeam && selectedRound ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedTeam.name}</h2>
                    <Badge>{selectedRound.name}</Badge>
                  </div>

                  {/* Judging Criteria */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Judging Criteria:</h3>
                    <div className="space-y-4">
                      {selectedRound.judgingCriteria?.map((criteria, index) => (
                        <div key={index}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {criteria.name} (Max: {criteria.maxPoints} points)
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={criteria.maxPoints}
                            value={scores[criteria.name] || ''}
                            onChange={(e) => handleScoreChange(criteria.name, e.target.value)}
                            placeholder={`0-${criteria.maxPoints}`}
                          />
                          {criteria.description && (
                            <p className="text-sm text-gray-500 mt-1">{criteria.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Score */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Score:</span>
                      <span className="text-2xl font-bold text-red-600">
                        {Object.values(scores).reduce((sum, score) => sum + score, 0)} / {selectedRound.maxScore}
                      </span>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remarks
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="Brief comments about the team's performance..."
                    />
                  </div>

                  {/* Detailed Feedback */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detailed Feedback
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="Provide detailed feedback for the team..."
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitScores}
                    loading={submitting}
                    icon={Send}
                    className="w-full"
                  >
                    Submit Scores
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a Team to Score</h3>
                  <p className="text-gray-600">
                    Choose a team from the list to start scoring
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}