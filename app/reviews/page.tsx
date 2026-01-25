// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import { Header } from '@/components/header';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Star, Plus, Loader2 } from 'lucide-react';
// import { useReviews } from '@/hooks/useReviews';
// import { PendingReview } from '@/types'; // Import PendingReview type

// export default function ReviewsPage() {
//   const [reviewData, setReviewData] = useState({
//     rating: 5,
//     title: '',
//     content: '',
//   });
//   const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
//   const [selectedReview, setSelectedReview] = useState<any | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false); // Declare setIsSubmitting variable

//   const { pendingReviews, writtenReviews, submitReview, loading, error } = useReviews();

//   const handleSubmitReview = async () => {
//     if (selectedReview && reviewData.title && reviewData.content) {
//       setIsSubmitting(true);
//       try {
//         await submitReview(selectedReview.id, {
//           rating: reviewData.rating,
//           title: reviewData.title,
//           content: reviewData.content,
//         });
//         setIsReviewDialogOpen(false);
//         setReviewData({ rating: 5, title: '', content: '' });
//         setSelectedReview(null);
//       } catch (err) {
//         console.error('Failed to submit review:', err);
//       } finally {
//         setIsSubmitting(false);
//       }
//     }
//   };

//   return (
//     <>
//       <Header />
//       <main className="bg-background min-h-screen">
//         <div className="max-w-4xl mx-auto px-4 py-8">
//           {/* Header */}
//           <div className="mb-8">
//             <h1 className="text-3xl font-bold text-foreground mb-2">My Reviews</h1>
//             <p className="text-muted-foreground">
//               Share your experience and help other buyers make informed decisions
//             </p>
//           </div>

//           {/* Pending Reviews Section */}
//           {loading ? (
//             <Card className="mb-12">
//               <CardContent className="p-12 text-center">
//                 <p className="text-muted-foreground">Loading...</p>
//               </CardContent>
//             </Card>
//           ) : error ? (
//             <Card className="mb-12">
//               <CardContent className="p-12 text-center">
//                 <p className="text-red-600">{error}</p>
//               </CardContent>
//             </Card>
//           ) : pendingReviews.filter((r: any) => r.status === 'pending').length > 0 && (
//             <div className="mb-12">
//               <h2 className="text-2xl font-bold text-foreground mb-6">
//                 Awaiting Your Review
//               </h2>

//               <div className="space-y-4">
//                 {pendingReviews
//                   .filter((r) => r.status === 'pending')
//                   .map((review) => (
//                     <Card key={review.id} className="hover:shadow-md transition-shadow">
//                       <CardContent className="p-6">
//                         <div className="flex gap-6 items-start">
//                           <div className="w-24 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
//                             <img
//                               src={review.image || "/placeholder.svg"}
//                               alt={review.productName}
//                               className="w-full h-full object-cover"
//                             />
//                           </div>

//                           <div className="flex-1">
//                             <h3 className="font-semibold text-lg text-foreground mb-1">
//                               {review.productName}
//                             </h3>
//                             <p className="text-sm text-muted-foreground mb-3">
//                               Purchased from {review.seller} on{' '}
//                               {new Date(review.purchaseDate).toLocaleDateString()}
//                             </p>
//                             <p className="text-sm text-muted-foreground mb-4">
//                               Help other buyers by sharing your experience with this product
//                             </p>

//                             <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
//                               <DialogTrigger asChild>
//                                 <Button
//                                   onClick={() => setSelectedReview(review)}
//                                 >
//                                   Write Review
//                                 </Button>
//                               </DialogTrigger>
//                               <DialogContent>
//                                 <DialogHeader>
//                                   <DialogTitle>Write a Review</DialogTitle>
//                                   <DialogDescription>
//                                     Share your experience with{' '}
//                                     {selectedReview?.productName}
//                                   </DialogDescription>
//                                 </DialogHeader>

//                                 <div className="space-y-6">
//                                   {/* Rating */}
//                                   <div>
//                                     <label className="text-sm font-medium text-foreground mb-3 block">
//                                       Rating
//                                     </label>
//                                     <div className="flex gap-2">
//                                       {[1, 2, 3, 4, 5].map((star) => (
//                                         <button
//                                           key={star}
//                                           onClick={() =>
//                                             setReviewData({
//                                               ...reviewData,
//                                               rating: star,
//                                             })
//                                           }
//                                           className="focus:outline-none transition-colors"
//                                         >
//                                           <Star
//                                             className={`h-8 w-8 ${
//                                               star <= reviewData.rating
//                                                 ? 'fill-yellow-500 text-yellow-500'
//                                                 : 'text-muted-foreground'
//                                             }`}
//                                           />
//                                         </button>
//                                       ))}
//                                     </div>
//                                   </div>

//                                   {/* Title */}
//                                   <div>
//                                     <label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">
//                                       Review Title
//                                     </label>
//                                     <Input
//                                       id="title"
//                                       placeholder="Summarize your experience..."
//                                       value={reviewData.title}
//                                       onChange={(e) =>
//                                         setReviewData({
//                                           ...reviewData,
//                                           title: e.target.value,
//                                         })
//                                       }
//                                     />
//                                   </div>

//                                   {/* Content */}
//                                   <div>
//                                     <label htmlFor="content" className="text-sm font-medium text-foreground mb-2 block">
//                                       Your Review
//                                     </label>
//                                     <Textarea
//                                       id="content"
//                                       placeholder="Tell other buyers about your experience... What did you like? What could be improved?"
//                                       value={reviewData.content}
//                                       onChange={(e) =>
//                                         setReviewData({
//                                           ...reviewData,
//                                           content: e.target.value,
//                                         })
//                                       }
//                                       rows={5}
//                                     />
//                                   </div>

//                                   <Button
//                                     onClick={handleSubmitReview}
//                                     disabled={
//                                       !reviewData.title || !reviewData.content
//                                     }
//                                     className="w-full"
//                                   >
//                                     Submit Review
//                                   </Button>
//                                 </div>
//                               </DialogContent>
//                             </Dialog>
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))}
//               </div>
//             </div>
//           )}

//           {/* Written Reviews Section */}
//           <div>
//             <h2 className="text-2xl font-bold text-foreground mb-6">
//               Your Reviews
//             </h2>

//             {writtenReviews.length > 0 ? (
//               <div className="space-y-4">
//                 {writtenReviews.map((review) => (
//                   <Card key={review.id} className="hover:shadow-md transition-shadow">
//                     <CardContent className="p-6">
//                       <div className="flex items-start justify-between mb-4">
//                         <div>
//                           <h3 className="font-semibold text-lg text-foreground mb-1">
//                             {review.title}
//                           </h3>
//                           <p className="text-sm text-muted-foreground">
//                             {review.productName} by {review.seller} • {review.date}
//                           </p>
//                         </div>
//                       </div>

//                       <div className="flex items-center gap-2 mb-4">
//                         {[...Array(review.rating)].map((_, i) => (
//                           <Star
//                             key={i}
//                             className="h-4 w-4 fill-yellow-500 text-yellow-500"
//                           />
//                         ))}
//                       </div>

//                       <p className="text-foreground mb-4">{review.content}</p>

//                       <div className="flex items-center justify-between">
//                         <p className="text-sm text-muted-foreground">
//                           {review.helpful} people found this helpful
//                         </p>
//                         <div className="flex gap-2">
//                           <Button variant="outline" size="sm">
//                             Helpful
//                           </Button>
//                           <Button variant="outline" size="sm">
//                             Edit
//                           </Button>
//                           <Button variant="outline" size="sm">
//                             Delete
//                           </Button>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             ) : (
//               <Card>
//                 <CardContent className="p-12 text-center">
//                   <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
//                   <p className="text-lg text-muted-foreground mb-4">
//                     You haven't written any reviews yet
//                   </p>
//                   <p className="text-sm text-muted-foreground">
//                     Review completed purchases to help other buyers
//                   </p>
//                 </CardContent>
//               </Card>
//             )}
//           </div>
//         </div>
//       </main>
//     </>
//   );
// }
