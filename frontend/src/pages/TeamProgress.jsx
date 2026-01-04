import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Trophy,
  Target,
  Upload,
  ExternalLink,
  Calendar,
  MapPin,
  Award,
  TrendingUp,
  FileText,
  Link2,
} from 'lucide-react';
import { teamAPI, hackathonAPI } from '../services/api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function TeamProgress() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [hackathon, setHackathon] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const teamRes = await teamAPI.getById(id);
      const teamData = teamRes.data.team;
      setTeam(teamData);

      // Extract hackathon ID - it might be an object or a string
      const hackathonId = teamData.hackathon?._id || teamData.hackathon;

      const [hackathonRes, currentRoundRes] = await Promise.all([
        hackathonAPI.getById(hackathonId),
        hackathonAPI.getCurrentRound(hackathonId),
      ]);

      setHackathon(hackathonRes.data.hackathon);
      setCurrentRound(currentRoundRes.data.currentRound);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load team progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading progress...</p>
        </div>
      </div>
    );
  }

  if (!team || !hackathon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Team not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const isEliminated = team.isEliminated;
  const completedRounds = hackathon.rounds.filter((r) => r.status === 'completed');
  const upcomingRounds = hackathon.rounds.filter(
    (r) => r.status === 'pending' && new Date(r.startTime) > new Date()
  );

  const hasSubmittedForRound = (roundId) => {
    return team.submissions.some((s) => s.round === roundId);
  };

  const getScoreForRound = (roundId) => {
    const scores = team.scores.filter((s) => s.round === roundId && s.isFinalized);
    if (scores.length === 0) return null;

    const avgScore =
      scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length;
    const maxScore = scores[0]?.maxPossibleScore || 100;

    return { avgScore: avgScore.toFixed(2), maxScore };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Team Progress</h1>
              <p className="text-gray-600">{team.teamName}</p>
            </div>
            <Link to={`/teams/${id}`}>
              <Button icon={ExternalLink} variant="outline">
                View Team Details
              </Button>
            </Link>
          </div>
        </div>

        {/* Team Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Status</h3>
            </div>
            <Badge
              variant={
                isEliminated
                  ? 'error'
                  : team.registrationStatus === 'approved'
                  ? 'success'
                  : 'warning'
              }
            >
              {isEliminated
                ? 'Eliminated'
                : team.registrationStatus === 'approved'
                ? 'Active'
                : team.registrationStatus}
            </Badge>
          </div>

          {team.rank && (
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-yellow-600" />
                <h3 className="font-bold text-gray-900">Current Rank</h3>
              </div>
              <div className="text-3xl font-bold text-indigo-600">#{team.rank}</div>
            </div>
          )}

          {team.overallScore !== undefined && (
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h3 className="font-bold text-gray-900">Overall Score</h3>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {team.overallScore.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Eliminated Message */}
        {isEliminated && (
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-red-900 mb-2">Team Eliminated</h3>
                <p className="text-red-700 mb-2">
                  Your team was eliminated in: <strong>{team.eliminatedInRound?.name}</strong>
                </p>
                {team.eliminationReason && (
                  <p className="text-red-600">Reason: {team.eliminationReason}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Current Round - What to do NOW */}
        {!isEliminated && currentRound && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">What You Need To Do Now</h2>
                <p className="text-gray-600">Current Active Round</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentRound.name}</h3>
                  <p className="text-gray-600">{currentRound.description}</p>
                </div>
                <Badge variant="success">Ongoing</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Deadline</div>
                    <div className="font-semibold text-gray-900">
                      {new Date(currentRound.endTime).toLocaleDateString()} at{' '}
                      {new Date(currentRound.endTime).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Mode</div>
                    <div className="font-semibold text-gray-900 capitalize">{currentRound.mode}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="font-semibold text-gray-900 capitalize">{currentRound.type}</div>
                  </div>
                </div>
              </div>

              {currentRound.instructions && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-4">
                  <h4 className="font-bold text-gray-900 mb-2">Instructions:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{currentRound.instructions}</p>
                </div>
              )}

              {currentRound.meetingLink && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 mb-4">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-purple-600" />
                    <a
                      href={currentRound.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      Join Meeting Link →
                    </a>
                  </div>
                </div>
              )}

              {currentRound.location && (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    <span className="text-gray-700">
                      <strong>Location:</strong> {currentRound.location}
                    </span>
                  </div>
                </div>
              )}

              {/* Submission Requirements */}
              {currentRound.type === 'submission' && currentRound.submissionConfig && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 mb-4">
                  <h4 className="font-bold text-gray-900 mb-3">Submission Requirements:</h4>
                  <ul className="space-y-2">
                    {currentRound.submissionConfig.requireProjectLink && (
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Project Link (Required)
                      </li>
                    )}
                    {currentRound.submissionConfig.requireDemoLink && (
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Demo Link (Required)
                      </li>
                    )}
                    {currentRound.submissionConfig.requireVideoLink && (
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Video Link (Required)
                      </li>
                    )}
                    {currentRound.submissionConfig.requireGithubRepo && (
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        GitHub Repository (Required)
                      </li>
                    )}
                    {currentRound.submissionConfig.maxFiles > 0 && (
                      <li className="flex items-center gap-2 text-gray-700">
                        <Upload className="w-4 h-4 text-green-600" />
                        Upload up to {currentRound.submissionConfig.maxFiles} file(s)
                        {currentRound.submissionConfig.maxFileSize && (
                          <span className="text-sm text-gray-500">
                            (Max {(currentRound.submissionConfig.maxFileSize / 1024 / 1024).toFixed(0)}MB each)
                          </span>
                        )}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-6">
                {hasSubmittedForRound(currentRound._id) ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="font-semibold text-green-700">Submission Complete!</span>
                  </div>
                ) : currentRound.type === 'submission' ? (
                  <Link to={`/teams/${id}/submit?round=${currentRound._id}`}>
                    <Button className="w-full" size="lg" icon={Upload}>
                      Submit for This Round
                    </Button>
                  </Link>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-gray-700">
                      This is a <strong>{currentRound.type}</strong> round. Follow the instructions above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Timeline */}
        <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Rounds Progress</h2>

          <div className="space-y-6">
            {hackathon.rounds
              .sort((a, b) => a.order - b.order)
              .map((round, index) => {
                const hasSubmitted = hasSubmittedForRound(round._id);
                const score = getScoreForRound(round._id);
                const isCurrent = currentRound?._id === round._id;
                const isCompleted = round.status === 'completed';
                const isPending = round.status === 'pending';

                return (
                  <div key={round._id} className="flex gap-4">
                    {/* Timeline Icon */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-green-100 text-green-600'
                            : isCurrent
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : isCurrent ? (
                          <Clock className="w-6 h-6" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </div>
                      {index < hackathon.rounds.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-200 my-2"></div>
                      )}
                    </div>

                    {/* Round Info */}
                    <div className="flex-1 pb-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{round.name}</h3>
                          <p className="text-gray-600 text-sm mb-2">{round.description}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{new Date(round.startTime).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{round.type}</span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            isCompleted ? 'success' : isCurrent ? 'info' : 'default'
                          }
                        >
                          {round.status}
                        </Badge>
                      </div>

                      {hasSubmitted && (
                        <div className="mt-3 flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-semibold">Submitted</span>
                        </div>
                      )}

                      {score && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                          <div className="text-sm text-gray-600">Your Score</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {score.avgScore} / {score.maxScore}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Upcoming Rounds */}
        {upcomingRounds.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Rounds</h2>
            <div className="space-y-4">
              {upcomingRounds.map((round) => (
                <div key={round._id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{round.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{round.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>Starts: {new Date(round.startTime).toLocaleString()}</span>
                      </div>
                    </div>
                    <Badge variant="default">{round.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
