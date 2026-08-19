"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Button } from "@scibly/ui/components/button";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { GripVertical, LayoutGrid, Plus, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { resolveBlockDocUrl } from "@/lib/utils";
import { applyDisplayOrder } from "@/shared/content/editor/assessment/learner/answer-order";
import {
  getQuestionBlockAttributes,
  updateQuestionAttributes,
} from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import { AvailableItemsZone } from "@/shared/content/editor/blocks/questions/drag-and-drop/components/available-items-zone";
import { DraggableItem } from "@/shared/content/editor/blocks/questions/drag-and-drop/components/draggable-item";
import { DraggableItemUI } from "@/shared/content/editor/blocks/questions/drag-and-drop/components/draggable-item-ui";
import { DropZone } from "@/shared/content/editor/blocks/questions/drag-and-drop/components/drop-zone";
import {
  type QuestionData,
  type UserAnswer,
} from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";
import {
  DRAG_AND_DROP_NODE_NAME,
  dragAndDropSchema,
} from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";
import { deriveLearnerPlacements } from "@/shared/content/editor/blocks/questions/drag-and-drop/utils/derive-learner-placements";
import {
  BlockSettingsContainer,
  BlockSettingsSwitch,
} from "@/shared/content/editor/blocks/ui/block-settings-ui";
import {
  buildCorrectStaggerIndexMap,
  getMappingGradedStatus,
  QA_GAME,
  QACelebrationMotion,
  QASolutionPlacementChip,
  useQACelebration,
} from "@/shared/content/editor/blocks/ui/qa-celebration";
import { QALearnerResetButton } from "@/shared/content/editor/blocks/ui/qa-learner-reset-button";
import { QuestionBlockGradedFrame } from "@/shared/content/editor/blocks/ui/question-block-graded-frame";
import ReactBlockWrapper from "@/shared/content/editor/blocks/ui/react-block-wrapper";
import { useQuestionBlockRegistration } from "@/shared/content/editor/runtime/hooks/use-question-block";

const DragAndDropBlock = memo((props: NodeViewProps) => {
  const { isEditable } = props.editor;

  const attrs = getQuestionBlockAttributes<QuestionData, UserAnswer>(
    props.node,
  );

  const { hidden, isReadOnly, gradedState, displayOrder, missingSolution } =
    useQuestionBlockRegistration<QuestionData, UserAnswer>(props, {
      blockType: DRAG_AND_DROP_NODE_NAME,
      isEmpty: (q) => !dragAndDropSchema.safeParse(q).success,

      candidates: (q) => q.items.map((item) => item.id),
    });

  const { celebrateKey, isGraded, isFullyCorrect } =
    useQACelebration(gradedState);

  const questionData = attrs.questionBlockAttributes.questionData;
  const userAnswers = useMemo(
    () => (isEditable ? {} : attrs.questionBlockAttributes.userAnswers || {}),
    [isEditable, attrs.questionBlockAttributes.userAnswers],
  );
  const learnerPlacements = useMemo(() => {
    const placements = deriveLearnerPlacements(questionData, userAnswers);
    return {
      ...placements,

      availableItems: applyDisplayOrder(
        placements.availableItems,
        (item) => item.id,
        displayOrder,
      ),
    };
  }, [questionData, userAnswers, displayOrder]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleItemClick = (id: string) => {
    if (isReadOnly) return;
    if (selectedItemId === id) {
      setSelectedItemId(null);
    } else {
      setSelectedItemId(id);
    }
  };

  const handleZoneClick = (zoneId: string) => {
    if (isReadOnly || !selectedItemId) return;

    const newAnswers = { ...userAnswers };
    if (zoneId === "unassigned") {
      delete newAnswers[selectedItemId];
    } else {
      newAnswers[selectedItemId] = zoneId;
    }

    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
      userAnswers: newAnswers,
    });
    setSelectedItemId(null);
  };

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setSelectedItemId(null);
    setActiveId(String(event.active.id));
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!isEditable && !isReadOnly && over) {
      const itemId = String(active.id);
      const zoneId = String(over.id);

      const newAnswers = { ...userAnswers };

      if (zoneId === "unassigned") {
        delete newAnswers[itemId];
      } else {
        newAnswers[itemId] = zoneId;
      }

      updateQuestionAttributes<QuestionData, UserAnswer>(props, {
        userAnswers: newAnswers,
      });
    }
  };

  const activeItem = useMemo(() => {
    return activeId ? questionData.items.find((i) => i.id === activeId) : null;
  }, [activeId, questionData.items]);

  const getLearnerItemStatus = useCallback(
    (itemId: string) => {
      const correctZoneId = questionData.correctMappings[itemId];
      if (correctZoneId) {
        return getMappingGradedStatus(
          correctZoneId,
          userAnswers[itemId],
          isGraded,
        );
      }
      if (!isGraded || !userAnswers[itemId]) return "neutral";
      return isFullyCorrect ? "correct" : "incorrect";
    },
    [isFullyCorrect, isGraded, questionData.correctMappings, userAnswers],
  );

  const correctItemStaggerIndex = useMemo(
    () =>
      buildCorrectStaggerIndexMap(
        questionData.items.map((item) => item.id),
        getLearnerItemStatus,
      ),
    [getLearnerItemStatus, questionData.items],
  );

  const missingSolutionItemsByZone = useMemo(() => {
    const map = new Map<string, typeof questionData.items>();
    for (const zone of questionData.zones) {
      map.set(zone.id, []);
    }
    if (!isGraded) return map;

    for (const item of questionData.items) {
      const correctZoneId = questionData.correctMappings[item.id];
      if (!correctZoneId) continue;
      if (userAnswers[item.id] === correctZoneId) continue;
      map.get(correctZoneId)?.push(item);
    }
    return map;
  }, [isGraded, questionData, userAnswers]);

  const renderGradedItem = (
    item: (typeof questionData.items)[number],
    options: { isMatched?: boolean } = {},
  ) => {
    const gradedStatus = getLearnerItemStatus(item.id);

    return (
      <QACelebrationMotion
        key={item.id}
        celebrateKey={celebrateKey}
        enabled={isGraded && gradedStatus === "correct"}
        className="max-w-full min-w-0"
        staggerIndex={
          isFullyCorrect ? (correctItemStaggerIndex.get(item.id) ?? 0) : 0
        }
      >
        <DraggableItem
          id={item.id}
          label={item.label}
          isMatched={options.isMatched}
          isSelected={selectedItemId === item.id}
          isGraded={isGraded}
          gradedStatus={gradedStatus}
          disabled={isReadOnly || isGraded}
          onClick={
            isReadOnly || isGraded ? undefined : () => handleItemClick(item.id)
          }
        />
      </QACelebrationMotion>
    );
  };

  const handleAddItemToZone = (zoneId: string) => {
    const newId = `item-${crypto.randomUUID()}`;
    const newItems = [...questionData.items, { id: newId, label: "" }];
    const newMappings = { ...questionData.correctMappings, [newId]: zoneId };
    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
      questionData: {
        ...questionData,
        items: newItems,
        correctMappings: newMappings,
      },
    });
  };

  const handleAddDistractor = () => {
    const newId = `item-${crypto.randomUUID()}`;
    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
      questionData: {
        ...questionData,
        items: [...questionData.items, { id: newId, label: "" }],
      },
    });
  };

  const handleAddZone = () => {
    const newId = `zone-${crypto.randomUUID()}`;
    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
      questionData: {
        ...questionData,
        zones: [...questionData.zones, { id: newId, label: "" }],
      },
    });
  };

  const handleRemoveItem = (id: string) => {
    const newItems = questionData.items.filter((i) => i.id !== id);
    const newMappings = { ...questionData.correctMappings };
    delete newMappings[id];
    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
      questionData: {
        ...questionData,
        items: newItems,
        correctMappings: newMappings,
      },
    });
  };

  const handleRemoveZone = (id: string) => {
    const newZones = questionData.zones.filter((z) => z.id !== id);
    const newMappings = { ...questionData.correctMappings };
    Object.keys(newMappings).forEach((itemId) => {
      if (newMappings[itemId] === id) {
        delete newMappings[itemId];
      }
    });
    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
      questionData: {
        ...questionData,
        zones: newZones,
        correctMappings: newMappings,
      },
    });
  };

  const updateItemLabel = (id: string, label: string) => {
    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
      questionData: {
        ...questionData,
        items: questionData.items.map((i) =>
          i.id === id ? { ...i, label } : i,
        ),
      },
    });
  };

  const updateZoneLabel = (id: string, label: string) => {
    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
      questionData: {
        ...questionData,
        zones: questionData.zones.map((z) =>
          z.id === id ? { ...z, label } : z,
        ),
      },
    });
  };

  if (hidden) return null;

  const settingsContent = (
    <BlockSettingsContainer>
      <BlockSettingsSwitch
        label="Optional"
        checked={attrs.questionBlockAttributes.optional}
        onCheckedChange={() =>
          updateQuestionAttributes<QuestionData, UserAnswer>(props, {
            optional: !attrs.questionBlockAttributes.optional,
          })
        }
      />
    </BlockSettingsContainer>
  );

  return (
    <NodeViewWrapper id={attrs.id} className="w-full">
      <ReactBlockWrapper
        isEditorEditable={isEditable}
        nodeViewProps={props}
        docLink={resolveBlockDocUrl("question", "drag-and-drop")}
        settingsContent={settingsContent}
      >
        <QuestionBlockGradedFrame
          state={gradedState}
          missingSolution={missingSolution}
          className="relative my-4 flex w-full flex-col gap-6 rounded-2xl py-2"
        >
          {isEditable ? (
            <div className="flex flex-col gap-8">
              {/* Edit Mode: Distractors (Top, like Available Items) */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Zusätzliche Elemente (Falsche Antworten)
                </span>
                <div className="flex min-h-[80px] flex-wrap items-start gap-3 rounded-xl bg-neutral-100 p-4 dark:bg-neutral-900">
                  {questionData.items
                    .filter((i) => !questionData.correctMappings[i.id])
                    .map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1.5 pr-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-within:ring-neutral-100"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-6 w-6 shrink-0 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <input
                          value={item.label}
                          onChange={(e) =>
                            updateItemLabel(item.id, e.target.value)
                          }
                          className="h-6 w-36 bg-transparent text-sm placeholder:text-neutral-400 focus:outline-none"
                          placeholder="Ablenkung (z.B. Stein)"
                        />
                      </div>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddDistractor}
                    className="h-10 border-dashed bg-transparent hover:bg-white dark:hover:bg-neutral-800"
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Hinzufügen
                  </Button>
                </div>
              </div>

              {/* Edit Mode: Zones Grid (Bottom, like Drop Zones) */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Kategorien & Zuordnungen
                </span>
                <div className="grid grid-cols-1 gap-4 @min-[48rem]:grid-cols-2">
                  {questionData.zones.map((zone) => {
                    const zoneItems = questionData.items.filter(
                      (i) => questionData.correctMappings[i.id] === zone.id,
                    );

                    return (
                      <div
                        key={zone.id}
                        className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
                      >
                        {/* Zone Header */}
                        <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-100/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/80">
                          <LayoutGrid className="h-4 w-4 shrink-0 text-neutral-500" />
                          <input
                            value={zone.label}
                            onChange={(e) =>
                              updateZoneLabel(zone.id, e.target.value)
                            }
                            className="flex-1 bg-transparent text-sm font-semibold placeholder:font-normal placeholder:text-neutral-400 focus:outline-none"
                            placeholder="Kategorie (z.B. Obst)"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveZone(zone.id)}
                            className="h-7 w-7 shrink-0 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Zone Items Container */}
                        <div className="flex min-h-[100px] flex-col gap-2 bg-neutral-50/50 p-3 dark:bg-neutral-900/30">
                          {zoneItems.map((item) => (
                            <div
                              key={item.id}
                              className="group flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-1.5 pr-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-within:ring-neutral-100"
                            >
                              <GripVertical className="h-4 w-4 shrink-0 text-neutral-300 dark:text-neutral-700" />
                              <input
                                value={item.label}
                                onChange={(e) =>
                                  updateItemLabel(item.id, e.target.value)
                                }
                                className="h-7 flex-1 bg-transparent text-sm placeholder:text-neutral-400 focus:outline-none"
                                placeholder="Passendes Element (z.B. Apfel)"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                className="h-6 w-6 shrink-0 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus:opacity-100 dark:hover:bg-red-950/50"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddItemToZone(zone.id)}
                            className="mt-1 h-9 w-full border border-dashed border-neutral-200 bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                          >
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Element
                            hinzufügen
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add New Zone Card */}
                  <Button
                    variant="outline"
                    onClick={handleAddZone}
                    className="flex h-full min-h-[150px] flex-col items-center justify-center gap-2 border-dashed bg-neutral-50/50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:bg-neutral-900/30 dark:hover:bg-neutral-900"
                  >
                    <Plus className="h-6 w-6 text-neutral-400" />
                    <span className="text-sm font-medium">
                      Neue Kategorie erstellen
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-8 select-none">
              <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                {/* Available Items Header */}
                <div className="flex h-7 items-center justify-between px-1 @min-[40rem]:h-8">
                  <span className={QA_GAME.bankLabel}>Verfügbare Elemente</span>
                  <QALearnerResetButton
                    visible={Object.keys(userAnswers).length > 0 && !isReadOnly}
                    onReset={() =>
                      updateQuestionAttributes<QuestionData, UserAnswer>(
                        props,
                        { userAnswers: {} },
                      )
                    }
                  />
                </div>

                {/* Available Items */}
                <AvailableItemsZone
                  onClick={() => handleZoneClick("unassigned")}
                  isReadyToDrop={
                    !!selectedItemId && Boolean(userAnswers[selectedItemId])
                  }
                >
                  {learnerPlacements.availableItems.map((item) =>
                    renderGradedItem(item),
                  )}
                  {learnerPlacements.availableItems.length === 0 && (
                    <div className="flex w-full items-center justify-center text-sm text-neutral-400 italic">
                      Alle Elemente zugeordnet
                    </div>
                  )}
                </AvailableItemsZone>

                {/* Drop Zones: two-up as soon as there's room — they're the
                    tallest thing on the scene, so stacking early keeps a
                    short (embedded) player from growing taller than its frame. */}
                <div className="grid grid-cols-1 gap-3 @min-[40rem]:grid-cols-2 @min-[40rem]:gap-4">
                  {questionData.zones.map((zone) => (
                    <DropZone
                      key={zone.id}
                      id={zone.id}
                      label={zone.label}
                      isReadyToDrop={!!selectedItemId}
                      onClick={() => handleZoneClick(zone.id)}
                    >
                      {questionData.items
                        .filter((item) => userAnswers[item.id] === zone.id)
                        .map((item) =>
                          renderGradedItem(item, { isMatched: true }),
                        )}
                      {isGraded
                        ? (missingSolutionItemsByZone.get(zone.id) ?? []).map(
                            (item) => (
                              <QASolutionPlacementChip
                                key={`solution-${zone.id}-${item.id}`}
                                label={item.label}
                              />
                            ),
                          )
                        : null}
                    </DropZone>
                  ))}
                </div>

                {isMounted &&
                  document.body &&
                  createPortal(
                    <DragOverlay
                      dropAnimation={{
                        duration: 250,
                        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                      }}
                    >
                      {activeItem ? (
                        <DraggableItemUI
                          id={activeItem.id}
                          label={activeItem.label}
                          isDragged
                        />
                      ) : null}
                    </DragOverlay>,
                    document.body,
                  )}
              </DndContext>
            </div>
          )}
        </QuestionBlockGradedFrame>
      </ReactBlockWrapper>
    </NodeViewWrapper>
  );
});

DragAndDropBlock.displayName = "DragAndDropBlock";
export default DragAndDropBlock;
