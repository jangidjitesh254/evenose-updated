import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CreditCard,
  Shield,
  Check,
  AlertCircle,
  Loader,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { teamAPI, paymentAPI } from '../services/api';
import { useAuthStore } from '../store';

export default function Payment() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);

  useEffect(() => {
    fetchTeamDetails();
  }, [teamId]);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchTeamDetails = async () => {
    try {
      const response = await teamAPI.getById(teamId);
      setTeam(response.data.team);
      
      // Check if already paid
      if (response.data.team.payment.status === 'completed') {
        toast.success('Payment already completed!');
        navigate(`/teams/${teamId}`);
      }
    } catch (error) {
      console.error('Failed to fetch team:', error);
      toast.error('Failed to load payment details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    try {
      const response = await paymentAPI.createHackathonOrder({ teamId });
      setPaymentOrder(response.data);
      return response.data;
    } catch (error) {
      toast.error('Failed to create payment order');
      throw error;
    }
  };

  const handlePayment = async () => {
    setProcessingPayment(true);
    
    try {
      const orderData = await createOrder();
      
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: team.hackathon.title,
        description: `Registration fee for ${team.teamName}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          await verifyPayment(response);
        },
        prefill: {
          name: user.fullName,
          email: user.email,
          contact: user.phone || '',
        },
        theme: {
          color: '#ef4444',
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setProcessingPayment(false);
      console.error('Payment initiation failed:', error);
    }
  };

  const verifyPayment = async (response) => {
    try {
      await paymentAPI.verifyHackathonPayment({
        teamId,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      
      toast.success('Payment successful! Registration completed');
      navigate(`/teams/${teamId}`);
    } catch (error) {
      toast.error('Payment verification failed. Please contact support.');
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-dark-900 mb-2">
              Complete Payment
            </h1>
            <p className="text-dark-600">
              Secure your spot in the hackathon
            </p>
          </div>

          {/* Order Summary */}
          <Card title="Order Summary" className="mb-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-dark-600">Hackathon:</span>
                <span className="font-semibold">{team.hackathon.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-600">Team:</span>
                <span className="font-semibold">{team.teamName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-600">Team Members:</span>
                <span className="font-semibold">{team.members.length} members</span>
              </div>
              
              <hr className="border-dark-200" />
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-primary-600">
                  ₹{team.payment.amount}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <Card title="Payment Method" className="mb-6">
            <div className="p-4 border-2 border-primary-500 rounded-xl bg-primary-50">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-6 h-6 text-primary-600" />
                <span className="font-semibold text-lg">Razorpay</span>
                <Badge variant="success">Secure</Badge>
              </div>
              <p className="text-sm text-dark-600">
                Pay securely using Credit Card, Debit Card, Net Banking, UPI, or Wallets
              </p>
            </div>
          </Card>

          {/* Security Info */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">
                  Secure Payment
                </h3>
                <p className="text-sm text-green-700">
                  Your payment information is encrypted and secure. We don't store your card details.
                </p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <Card title="Important Notes" className="mb-6">
            <div className="space-y-2 text-sm text-dark-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
                <p>Payment is non-refundable once the hackathon registration closes</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
                <p>Ensure all team details are correct before proceeding</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
                <p>You will receive a confirmation email after successful payment</p>
              </div>
            </div>
          </Card>

          {/* Payment Button */}
          <div className="space-y-4">
            <Button
              onClick={handlePayment}
              loading={processingPayment}
              fullWidth
              size="lg"
              icon={CreditCard}
            >
              {processingPayment ? 'Processing...' : `Pay ₹${team.payment.amount}`}
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate(`/teams/${teamId}`)}
              disabled={processingPayment}
            >
              Cancel
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-dark-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>SSL Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>PCI Compliant</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
