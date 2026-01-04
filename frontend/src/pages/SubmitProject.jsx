import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Upload,
  File,
  Link as LinkIcon,
  Github,
  Video,
  FileText,
  X,
  Check,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { teamAPI, hackathonAPI } from '../services/api';
import { useAuthStore } from '../store';

export default function SubmitProject() {
  const { teamId, roundId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [team, setTeam] = useState(null);
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [techStack, setTechStack] = useState(['']);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    fetchTeamAndRound();
  }, [teamId, roundId]);

  const fetchTeamAndRound = async () => {
    try {
      const [teamRes, hackathonRes] = await Promise.all([
        teamAPI.getById(teamId),
        teamAPI.getById(teamId).then(res => 
          hackathonAPI.getById(res.data.team.hackathon._id)
        )
      ]);

      setTeam(teamRes.data.team);
      
      const foundRound = hackathonRes.data.hackathon.rounds.find(
        r => r._id === roundId
      );
      setRound(foundRound);

      // Check if already submitted
      const existingSubmission = teamRes.data.team.submissions.find(
        s => s.round.toString() === roundId
      );
      if (existingSubmission) {
        toast.error('Already submitted for this round');
        navigate(`/teams/${teamId}`);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const addTechStack = () => {
    setTechStack([...techStack, '']);
  };

  const updateTechStack = (index, value) => {
    const updated = [...techStack];
    updated[index] = value;
    setTechStack(updated);
  };

  const removeTechStack = (index) => {
    setTechStack(techStack.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    // Validate tech stack
    const validTechStack = techStack.filter(t => t.trim());
    if (validTechStack.length === 0) {
      toast.error('Please add at least one technology');
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, you'd upload files to cloud storage first
      // For now, we'll just send the submission data
      
      const submissionData = {
        roundId,
        projectLink: data.projectLink,
        githubRepo: data.githubRepo,
        demoLink: data.demoLink,
        videoLink: data.videoLink,
        presentationLink: data.presentationLink,
        description: data.description,
        techStack: validTechStack,
      };

      await teamAPI.submit(teamId, submissionData);
      toast.success('Project submitted successfully!');
      navigate(`/teams/${teamId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark-900 mb-2">
            Submit Project
          </h1>
          <p className="text-dark-600">
            Team: <strong>{team?.teamName}</strong> • Round: <strong>{round?.name}</strong>
          </p>
        </div>

        {/* Round Info */}
        <Card className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">{round?.name}</h2>
              <Badge variant={round?.mode === 'online' ? 'info' : 'secondary'}>
                {round?.mode}
              </Badge>
              <Badge variant="warning" className="ml-2">{round?.type}</Badge>
            </div>
          </div>
          
          {round?.description && (
            <p className="text-dark-700 mb-4">{round.description}</p>
          )}
          
          {round?.instructions && (
            <div className="p-4 bg-accent-50 border border-accent-200 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-accent-600" />
                Instructions
              </h3>
              <p className="text-sm text-dark-700">{round.instructions}</p>
            </div>
          )}
        </Card>

        {/* Submission Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card title="Project Submission">
            <div className="space-y-6">
              {/* Project Links */}
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Project Link"
                  icon={LinkIcon}
                  placeholder="https://your-project.com"
                  error={errors.projectLink?.message}
                  {...register('projectLink', {
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'Must be a valid URL'
                    }
                  })}
                />

                <Input
                  label="Demo Link"
                  icon={LinkIcon}
                  placeholder="https://demo.your-project.com"
                  {...register('demoLink', {
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'Must be a valid URL'
                    }
                  })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="GitHub Repository"
                  icon={Github}
                  placeholder="https://github.com/username/repo"
                  {...register('githubRepo', {
                    pattern: {
                      value: /^https?:\/\/github\.com\/.+/,
                      message: 'Must be a valid GitHub URL'
                    }
                  })}
                />

                <Input
                  label="Video Demo Link"
                  icon={Video}
                  placeholder="https://youtube.com/watch?v=..."
                  {...register('videoLink', {
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'Must be a valid URL'
                    }
                  })}
                />
              </div>

              <Input
                label="Presentation Link"
                icon={FileText}
                placeholder="https://slides.com/presentation"
                helperText="Google Slides, PowerPoint Online, etc."
                {...register('presentationLink', {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Must be a valid URL'
                  }
                })}
              />

              {/* Project Description */}
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Project Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="6"
                  className="input"
                  placeholder="Describe your project, its features, and what makes it unique..."
                  {...register('description', {
                    required: 'Description is required',
                    minLength: {
                      value: 100,
                      message: 'Description must be at least 100 characters'
                    }
                  })}
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Tech Stack */}
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Tech Stack <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {techStack.map((tech, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        className="input flex-1"
                        placeholder="e.g., React, Node.js, MongoDB"
                        value={tech}
                        onChange={(e) => updateTechStack(index, e.target.value)}
                      />
                      {techStack.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTechStack(index)}
                          className="p-3 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    onClick={addTechStack}
                  >
                    Add Technology
                  </Button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Additional Files (Optional)
                </label>
                <div className="border-2 border-dashed border-dark-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-dark-400 mb-2" />
                    <p className="text-dark-700 font-medium mb-1">
                      Click to upload files
                    </p>
                    <p className="text-sm text-dark-500">
                      PDFs, images, or documents
                    </p>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-dark-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <File className="w-5 h-5 text-primary-600" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-dark-500">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Terms */}
              <div className="p-4 bg-accent-50 border border-accent-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <input type="checkbox" required className="mt-1" id="terms" />
                  <label htmlFor="terms" className="text-sm text-dark-700">
                    I confirm that this is my team's original work and all information provided is accurate. I understand that plagiarism or false information may result in disqualification.
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/teams/${teamId}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  icon={Check}
                >
                  Submit Project
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
