import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ArrowLeft, FileText, BookOpen, Layers, Bookmark, Plus, Trash2, PanelLeftClose, Lock } from 'lucide-react';
import { UserProfile } from '../types';

// Inline type definitions for library structures
interface LibraryArticle { id: string; title: string; content: string; isFree?: boolean; }
interface LibrarySection { id: string; name: string; articles: LibraryArticle[]; }
interface LibrarySubtopic { id: string; name: string; sections?: LibrarySection[]; articles?: LibraryArticle[]; }
interface LibraryTopic { id: string; name: string; articles: LibraryArticle[]; subtopics?: LibrarySubtopic[]; }
interface LibrarySubject { id: string; name: string; topics: LibraryTopic[]; }
interface PrepZaaLibrary { subjects: LibrarySubject[]; }

// Inline subscription utils stubs
const checkIsPremium = (user: UserProfile) => !!(user.subscription || (user.activePackages && user.activePackages.length > 0));
const getUnlockedArticleIdsForFree = (_lib?: any): string[] => [];

export interface TreeNodeData {
  id: string;
  name: string;
  type: 'subject' | 'topic' | 'subtopic' | 'section' | 'article';
  children?: TreeNodeData[];
  article?: LibraryArticle;
}

export const buildTree = (subjects: LibrarySubject[]): TreeNodeData[] => {
  return subjects.map(sub => ({
    id: sub.id,
    name: sub.name,
    type: 'subject',
    children: sub.topics.map(top => ({
      id: top.id,
      name: top.name,
      type: 'topic',
      children: (top.subtopics || []).map(subtop => {
        const children: TreeNodeData[] = [];
        if (subtop.sections && subtop.sections.length > 0) {
          subtop.sections.forEach(sec => {
            children.push({
              id: sec.id,
              name: sec.name,
              type: 'section',
              children: (sec.articles || []).map(art => ({
                id: art.id,
                name: art.title,
                type: 'article',
                article: art
              }))
            });
          });
        }
        if (subtop.articles && subtop.articles.length > 0) {
          subtop.articles.forEach(art => {
            children.push({
              id: art.id,
              name: art.title,
              type: 'article',
              article: art
            });
          });
        }
        return {
          id: subtop.id,
          name: subtop.name,
          type: 'subtopic',
          children
        };
      })
    }))
  }));
};

export const LibrarySidebarView = ({
  libraryData,
  activeArticleId,
  onSelectArticle,
  currentPath,
  onPathChange,
  setPrepZaaLibrary,
  onToggleSidebar,
  userProfile,
  targetExam,
  onUpgrade
}: {
  libraryData: PrepZaaLibrary | PrepZaaLibrary[];
  activeArticleId: string | null;
  onSelectArticle: (article: LibraryArticle) => void;
  currentPath?: TreeNodeData[];
  onPathChange?: (path: TreeNodeData[]) => void;
  setPrepZaaLibrary?: (data: any) => void;
  onToggleSidebar?: () => void;
  userProfile?: UserProfile;
  targetExam?: string;
  onUpgrade?: () => void;
}) => {
  const treeData = useMemo(() => {
    const subjects = Array.isArray(libraryData) ? libraryData[0]?.subjects : libraryData?.subjects;
    if (!subjects) return [];
    return buildTree(subjects);
  }, [libraryData]);

  const isPremium = checkIsPremium(userProfile);
  const unlockedArticleIds = useMemo(() => getUnlockedArticleIdsForFree(), [libraryData]);

  const [localPath, setLocalPath] = useState<TreeNodeData[]>([]);
  const path = currentPath !== undefined ? currentPath : localPath;
  const setPath = onPathChange !== undefined ? onPathChange : setLocalPath;

  // Automatically expand path when activeArticleId changes externally (e.g. from search)
  useEffect(() => {
    if (activeArticleId) {
      let foundPath: TreeNodeData[] | null = null;

      const searchTree = (nodes: TreeNodeData[], pathSoFar: TreeNodeData[]): boolean => {
        for (const node of nodes) {
          if (node.id === activeArticleId && node.type === 'article') {
            foundPath = [...pathSoFar];
            return true;
          }
          if (node.children) {
            if (searchTree(node.children, [...pathSoFar, node])) {
              return true;
            }
          }
        }
        return false;
      };

      searchTree(treeData, []);
      if (foundPath) {
        setPath(foundPath);
      }
    }
  }, [activeArticleId, treeData]);

  const currentNodes = path.length === 0 
    ? treeData 
    : path[path.length - 1].children || [];

  const handleBack = () => {
    setPath(path.slice(0, -1));
  };

  const handleSelectNode = (node: TreeNodeData) => {
    if (node.type === 'article') {
      if (node.article) onSelectArticle(node.article);
    } else {
      // Flexibly auto-open if this folder has exactly one child, and that child is an article
      if (node.children && node.children.length === 1 && node.children[0].type === 'article') {
        const singleArticle = node.children[0].article;
        if (singleArticle) {
          onSelectArticle(singleArticle);
          setPath([...path, node]);
          return;
        }
      }
      setPath([...path, node]);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'subject': return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case 'topic': return <Layers className="w-4 h-4 text-blue-400" />;
      case 'subtopic': return <Bookmark className="w-4 h-4 text-violet-400" />;
      case 'section': return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'article': return <FileText className="w-4 h-4 text-slate-400" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const canEdit = !!setPrepZaaLibrary;

  const handleAddSubject = () => {
    if (!setPrepZaaLibrary) return;
    const subjectName = prompt("Enter new Subject name:");
    if (!subjectName) return;
    
    const lib = Array.isArray(libraryData) ? libraryData[0] || { examType: "mec-pg", subjects: [] } : libraryData;
    const newSubject = { id: 'sub-' + Date.now(), name: subjectName, topics: [] };
    const newLib = {
      ...lib,
      subjects: [...(lib.subjects || []), newSubject]
    };
    setPrepZaaLibrary(Array.isArray(libraryData) ? [newLib] : newLib);
  };

  const handleAddChild = (node: TreeNodeData) => {
    if (!setPrepZaaLibrary) return;
    
    const lib = Array.isArray(libraryData) ? libraryData[0] || { examType: "mec-pg", subjects: [] } : libraryData;
    
    if (node.type === 'subject') {
      const topicName = prompt(`Add new Topic under subject "${node.name}":`);
      if (!topicName) return;
      const newTopic = { id: 'top-' + Date.now(), name: topicName, subtopics: [] };
      
      const newLib = {
        ...lib,
        subjects: lib.subjects.map((sub: any) => 
          sub.id === node.id ? { ...sub, topics: [...(sub.topics || []), newTopic] } : sub
        )
      };
      setPrepZaaLibrary(Array.isArray(libraryData) ? [newLib] : newLib);
    } 
    else if (node.type === 'topic') {
      const subtopicName = prompt(`Add new Subtopic under topic "${node.name}":`);
      if (!subtopicName) return;
      const newSubtopic = { id: 'subtop-' + Date.now(), name: subtopicName, sections: [], articles: [] };
      
      const newLib = {
        ...lib,
        subjects: lib.subjects.map((sub: any) => ({
          ...sub,
          topics: sub.topics.map((top: any) => 
            top.id === node.id ? { ...top, subtopics: [...(top.subtopics || []), newSubtopic] } : top
          )
        }))
      };
      setPrepZaaLibrary(Array.isArray(libraryData) ? [newLib] : newLib);
    } 
    else if (node.type === 'subtopic') {
      const isSection = confirm("Would you like to add a Section? (Cancel to add an Article directly instead)");
      if (isSection) {
        const secName = prompt(`Add new Section under subtopic "${node.name}":`);
        if (!secName) return;
        const newSec = { id: 'sec-' + Date.now(), name: secName, articles: [] };
        
        const newLib = {
          ...lib,
          subjects: lib.subjects.map((sub: any) => ({
            ...sub,
            topics: sub.topics.map((top: any) => ({
              ...top,
              subtopics: (top.subtopics || []).map((st: any) => 
                st.id === node.id ? { ...st, sections: [...(st.sections || []), newSec] } : st
              )
            }))
          }))
        };
        setPrepZaaLibrary(Array.isArray(libraryData) ? [newLib] : newLib);
      } else {
        const artTitle = prompt(`Add new Article under subtopic "${node.name}":`);
        if (!artTitle) return;
        const newArt = { id: 'art-' + Date.now(), title: artTitle, content: "" };
        
        const newLib = {
          ...lib,
          subjects: lib.subjects.map((sub: any) => ({
            ...sub,
            topics: sub.topics.map((top: any) => ({
              ...top,
              subtopics: (top.subtopics || []).map((st: any) => 
                st.id === node.id ? { ...st, articles: [...(st.articles || []), newArt] } : st
              )
            }))
          }))
        };
        setPrepZaaLibrary(Array.isArray(libraryData) ? [newLib] : newLib);
      }
    } 
    else if (node.type === 'section') {
      const artTitle = prompt(`Add new Article under section "${node.name}":`);
      if (!artTitle) return;
      const newArt = { id: 'art-' + Date.now(), title: artTitle, content: "" };
      
      const newLib = {
        ...lib,
        subjects: lib.subjects.map((sub: any) => ({
          ...sub,
          topics: sub.topics.map((top: any) => ({
            ...top,
            subtopics: (top.subtopics || []).map((st: any) => ({
              ...st,
              sections: (st.sections || []).map((sec: any) => 
                sec.id === node.id ? { ...sec, articles: [...(sec.articles || []), newArt] } : sec
              )
            }))
          }))
        }))
      };
      setPrepZaaLibrary(Array.isArray(libraryData) ? [newLib] : newLib);
    }
  };

  const handleDeleteNode = (node: TreeNodeData) => {
    if (!setPrepZaaLibrary) return;
    if (!confirm(`Are you sure you want to delete this ${node.type} "${node.name}" and all its contents?`)) return;
    
    const lib = Array.isArray(libraryData) ? libraryData[0] || { examType: "mec-pg", subjects: [] } : libraryData;
    
    const newLib = {
      ...lib,
      subjects: (lib.subjects || []).filter((sub: any) => sub.id !== node.id).map((sub: any) => ({
        ...sub,
        topics: (sub.topics || []).filter((top: any) => top.id !== node.id).map((top: any) => ({
          ...top,
          subtopics: (top.subtopics || []).filter((st: any) => st.id !== node.id).map((st: any) => ({
            ...st,
            sections: (st.sections || []).filter((sec: any) => sec.id !== node.id).map((sec: any) => ({
              ...sec,
              articles: (sec.articles || []).filter((art: any) => art.id !== node.id)
            })),
            articles: (st.articles || []).filter((art: any) => art.id !== node.id)
          }))
        }))
      }))
    };
    setPrepZaaLibrary(Array.isArray(libraryData) ? [newLib] : newLib);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-full shrink-0 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          PrepZaa Library
        </h2>
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {path.length > 0 && (
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 p-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 transition-colors border-b border-slate-800 shrink-0 text-left"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold truncate">
            {path[path.length - 1].name}
          </span>
        </button>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {currentNodes.map(node => {
          const isArticleLocked = node.type === 'article' && !isPremium && !unlockedArticleIds.includes(node.id);

          return (
            <div
              key={node.id}
              className={`w-full group flex items-center justify-between p-2 rounded-lg transition-colors border border-transparent ${
                activeArticleId === node.id && node.type === 'article'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <button
                onClick={() => handleSelectNode(node)}
                className="flex-1 flex items-center gap-2.5 overflow-hidden text-left cursor-pointer"
              >
                {getIcon(node.type)}
                <span className={`truncate ${node.type === 'article' ? 'text-xs' : 'text-sm font-medium'} ${isArticleLocked ? 'text-slate-400 dark:text-slate-500' : ''}`}>
                  {node.name}
                </span>
                {isArticleLocked && (
                  <span className="flex items-center gap-1 shrink-0 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20" title="Locked - Upgrade to Premium">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>

            <div className="flex items-center gap-1 shrink-0">
              {canEdit && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {node.type !== 'article' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddChild(node);
                      }}
                      className="p-1 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 rounded cursor-pointer transition-all"
                      title="Add child node"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node);
                    }}
                    className="p-1 hover:bg-red-500/15 text-slate-500 hover:text-red-400 rounded cursor-pointer transition-all"
                    title="Delete node"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              {node.type !== 'article' && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
            </div>
          </div>
        );
      })}
        
        {currentNodes.length === 0 && (
          <div className="p-4 text-center text-slate-500 text-xs">
            No items found.
          </div>
        )}

        {canEdit && (
          <div className="pt-2 border-t border-slate-800/50 mt-2 space-y-1">
            {path.length === 0 && (
              <button
                onClick={handleAddSubject}
                className="w-full flex items-center justify-center gap-2 p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/20 hover:border-transparent rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </button>
            )}
            {path.length === 1 && (
              <button
                onClick={() => handleAddChild(path[0])}
                className="w-full flex items-center justify-center gap-2 p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 hover:border-transparent rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Topic</span>
              </button>
            )}
            {path.length === 2 && (
              <button
                onClick={() => handleAddChild(path[1])}
                className="w-full flex items-center justify-center gap-2 p-2 bg-violet-500/10 text-violet-400 hover:bg-violet-500 hover:text-white border border-violet-500/20 hover:border-transparent rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subtopic</span>
              </button>
            )}
            {path.length >= 3 && (
              <button
                onClick={() => handleAddChild(path[path.length - 1])}
                className="w-full flex items-center justify-center gap-2 p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 hover:border-transparent rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Child Node</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibrarySidebarView;

