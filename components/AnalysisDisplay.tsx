import React from 'react';
import { AnalysisResult, Faction, GeneratedDrawing, Project, User } from '../types';
import { InitialView } from './analysis/InitialView';
import { LoadingView } from './analysis/LoadingView';
import { ErrorView } from './analysis/ErrorView';
import { ResultView } from './analysis/ResultView';

interface AnalysisDisplayProps {
  projectName: string;
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  selectedFaction: Faction | null;
  onClear: () => void;
  onGenerateVideo: () => void;
  isVideoLoading: boolean;
  videoUrl: string | null;
  videoError: string | null;
  drawings: GeneratedDrawing[];
  onRequestDrawing: (prompt: string) => void;
  onRemoveDrawing: (id: string) => void;
  onIncorporateSuggestions: (suggestionTexts: string[]) => void;
  onLaunchDeVinci: () => void;
  activeProject: Project | null;
  authenticatedUser: User;
  onGenerateSummary: (result: AnalysisResult) => Promise<string | null>;
  isSummaryLoading: boolean;
  summaryError: string | null;
}

export const AnalysisDisplay = (props: AnalysisDisplayProps) => {
  if (props.isLoading) {
    return <LoadingView />;
  }

  if (props.error) {
    return <ErrorView error={props.error} onClear={props.onClear} />;
  }

  if (props.result) {
    return (
      <ResultView
        projectName={props.projectName}
        result={props.result}
        selectedFaction={props.selectedFaction}
        onClear={props.onClear}
        onGenerateVideo={props.onGenerateVideo}
        isLoading={props.isLoading}
        isVideoLoading={props.isVideoLoading}
        videoUrl={props.videoUrl}
        videoError={props.videoError}
        drawings={props.drawings}
        onRequestDrawing={props.onRequestDrawing}
        onRemoveDrawing={props.onRemoveDrawing}
        onIncorporateSuggestions={props.onIncorporateSuggestions}
        onLaunchDeVinci={props.onLaunchDeVinci}
        activeProject={props.activeProject}
        authenticatedUser={props.authenticatedUser}
        onGenerateSummary={props.onGenerateSummary}
        isSummaryLoading={props.isSummaryLoading}
        summaryError={props.summaryError}
      />
    );
  }

  return <InitialView />;
};